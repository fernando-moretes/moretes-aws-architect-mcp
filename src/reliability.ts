import { z } from 'zod';
import { tool, text, short, lines, provenance } from './definition.js';

/**
 * Reliability, operations and FinOps calculators. Every tool here is a pure
 * function of its inputs: no network, no model, explicit formulas, explicit
 * limitations. Numbers are rounded for presentation only.
 */

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export const MAX_QUEUE_CAPACITY = 100000;

/** Erlang C via the bounded Erlang B recurrence; avoids factorial/power overflow.
 * B(0,a)=1; B(k,a)=a*B(k-1,a)/(k+a*B(k-1,a)); C=B/(1-rho+rho*B).
 * Reference: https://www.columbia.edu/~ww2040/ErlangBandCFormulas.pdf
 */
export function erlangC(servers: number, offeredLoad: number): number {
  if (!Number.isInteger(servers) || servers < 1 || servers > MAX_QUEUE_CAPACITY)
    throw new Error(`Total queue capacity must be between 1 and ${MAX_QUEUE_CAPACITY} concurrent slots`);
  if (!Number.isFinite(offeredLoad) || offeredLoad < 0) throw new Error('Offered load must be finite and nonnegative');
  if (offeredLoad >= servers) return 1;
  let blocking = 1;
  for (let k = 1; k <= servers; k++) {
    const weighted = offeredLoad * blocking;
    blocking = weighted / (k + weighted);
  }
  // Compute the spare fraction directly to retain precision near saturation.
  return blocking / ((servers - offeredLoad) / servers + offeredLoad / servers * blocking);
}

export function backoffSchedule(baseMs: number, factor: number, capMs: number, attempts: number, jitter: 'none' | 'full' | 'equal') {
  const rows: { attempt: number; delayMs: number; jitterMinMs: number; jitterMaxMs: number }[] = [];
  let cumulative = 0;
  for (let i = 1; i <= attempts; i++) {
    const raw = Math.min(capMs, baseMs * factor ** (i - 1));
    const min = jitter === 'none' ? raw : jitter === 'full' ? 0 : raw / 2;
    rows.push({ attempt: i, delayMs: round(raw, 0), jitterMinMs: round(min, 0), jitterMaxMs: round(raw, 0) });
    cumulative += raw;
  }
  return { rows, worstCaseWaitMs: round(cumulative, 0) };
}

const DR_TIERS = [
  { tier: 'backup-and-restore', rtoHours: [4, 72], rpoHours: [1, 24], relativeCost: 'lowest', requires: ['Automated, tested backups in the recovery region', 'IaC that recreates the stack from zero', 'Documented restore order and data validation'] },
  { tier: 'pilot-light', rtoHours: [0.5, 4], rpoHours: [0.1, 1], relativeCost: 'low', requires: ['Continuous data replication', 'Core infrastructure provisioned but scaled to zero', 'Scripted scale-up and DNS or traffic switch'] },
  { tier: 'warm-standby', rtoHours: [0.1, 0.5], rpoHours: [0.01, 0.1], relativeCost: 'medium', requires: ['Scaled-down full copy serving synthetic traffic', 'Health-based failover with a tested runbook', 'Capacity to scale to production within RTO'] },
  { tier: 'multi-site-active-active', rtoHours: [0, 0.05], rpoHours: [0, 0.01], relativeCost: 'highest', requires: ['Active traffic in every region', 'Conflict-free or partitioned data model', 'Regional isolation of failures and deploys'] }
] as const;

export const reliabilityTools = [
  tool('latency_budget',
    'Split an end-to-end latency objective across hops and show which hops exceed their share. Pure arithmetic over caller-supplied estimates.',
    {
      targetMs: z.number().positive().max(600000),
      percentile: z.enum(['p50', 'p95', 'p99']).default('p95'),
      hops: z.array(z.object({ name: short, estimatedMs: z.number().nonnegative().max(600000), parallelGroup: z.string().max(40).optional(), cacheable: z.boolean().default(false) })).min(1).max(30)
    },
    a => {
      const groups = new Map<string, number>();
      let serial = 0;
      for (const h of a.hops) {
        if (h.parallelGroup) groups.set(h.parallelGroup, Math.max(groups.get(h.parallelGroup) ?? 0, h.estimatedMs));
        else serial += h.estimatedMs;
      }
      const parallel = [...groups.values()].reduce((s, v) => s + v, 0);
      const total = serial + parallel;
      const remaining = a.targetMs - total;
      const share = a.targetMs / a.hops.length;
      return {
        kind: 'calculation',
        percentile: a.percentile,
        targetMs: a.targetMs,
        estimatedTotalMs: round(total),
        remainingMs: round(remaining),
        withinBudget: remaining >= 0,
        utilizationPercent: round(total / a.targetMs * 100, 1),
        hops: a.hops.map(h => ({ ...h, sharePercent: round(h.estimatedMs / Math.max(total, 1e-9) * 100, 1), overEqualShare: h.estimatedMs > share })).sort((x, y) => y.estimatedMs - x.estimatedMs),
        parallelGroups: Object.fromEntries([...groups.entries()].map(([g, v]) => [g, { criticalPathMs: v }])),
        suggestions: [
          ...(remaining < 0 ? ['Over budget: remove a hop, parallelize independent calls or cache the largest hop'] : []),
          ...a.hops.filter(h => h.cacheable && h.estimatedMs > share).map(h => `Hop "${h.name}" is cacheable and above its equal share; a cache hit removes it from the critical path`),
          ...(a.hops.length > 6 ? ['More than six serial hops; consider aggregating calls or an async path'] : [])
        ],
        limitations: ['Percentiles do not add linearly; summing p95 values overestimates the end-to-end p95 and is used here as a conservative budget', 'Queueing, retries and cold starts are excluded unless modeled as hops']
      };
    }),

  tool('queue_sizing',
    'Size consumers with Little\'s law and stable Erlang C: utilization, wait probability, backlog drain time and target consumers. At most 100,000 total concurrent slots (consumers × concurrency).',
    {
      arrivalsPerSecond: z.number().positive().max(1e7),
      serviceTimeMs: z.number().positive().max(3.6e6),
      consumers: z.number().int().positive().max(100000),
      backlogMessages: z.number().nonnegative().max(1e12).default(0),
      targetUtilizationPercent: z.number().min(10).max(95).default(70),
      maxConcurrencyPerConsumer: z.number().int().positive().max(10000).default(1)
    },
    a => {
      const serviceSeconds = a.serviceTimeMs / 1000;
      const offered = a.arrivalsPerSecond * serviceSeconds; // Erlangs
      const capacity = a.consumers * a.maxConcurrencyPerConsumer;
      const utilization = offered / capacity;
      const stable = utilization < 1;
      const pWait = erlangC(capacity, offered);
      const drainPerSecond = capacity / serviceSeconds - a.arrivalsPerSecond;
      const consumersForTarget = Math.ceil(offered / (a.targetUtilizationPercent / 100) / a.maxConcurrencyPerConsumer);
      return {
        kind: 'calculation',
        formulas: ['offeredLoad = arrivals × serviceTime (Little\'s law)', 'utilization = offeredLoad / (consumers × concurrency)', 'P(wait) = Erlang C(servers, offeredLoad)', 'drainSeconds = backlog / (capacity/serviceTime − arrivals)'],
        inputs: a,
        offeredLoadErlangs: round(offered, 3),
        totalCapacity: capacity,
        utilizationPercent: round(utilization * 100, 1),
        stable,
        waitProbability: stable ? round(pWait, 4) : 1,
        meanInSystem: stable ? round(offered + pWait * offered / (capacity - offered), 3) : null,
        backlogDrainSeconds: a.backlogMessages ? (drainPerSecond > 0 ? round(a.backlogMessages / drainPerSecond, 1) : null) : 0,
        consumersForTargetUtilization: consumersForTarget,
        visibilityTimeoutHintSeconds: round(Math.max(a.serviceTimeMs * 6 / 1000, 30), 0),
        warnings: [
          ...(!stable ? ['Unstable: arrivals exceed capacity; backlog grows without bound'] : []),
          ...(utilization > 0.85 && stable ? ['Above 85% utilization wait times grow sharply; plan headroom'] : []),
          ...(a.backlogMessages && drainPerSecond <= 0 ? ['Backlog never drains at current capacity'] : [])
        ],
        limitations: ['Assumes Poisson arrivals and exponential service times (M/M/c); bursty traffic waits longer', 'Ignores batch receive, broker limits, retries and failures']
      };
    }),

  tool('dr_strategy',
    'Compare disaster recovery tiers (backup-and-restore, pilot light, warm standby, active-active) against RTO, RPO and data constraints; returns feasible tiers and required capabilities, not a guarantee.',
    {
      workload: short,
      rtoMinutes: z.number().positive().max(10080),
      rpoMinutes: z.number().nonnegative().max(10080),
      dataGB: z.number().nonnegative().max(1e9).default(0),
      replicationBandwidthMbps: z.number().positive().max(1e6).optional(),
      regulatoryResidency: z.string().max(80).optional(),
      statefulComponents: lines.default([])
    },
    a => {
      const rtoH = a.rtoMinutes / 60, rpoH = a.rpoMinutes / 60;
      const tiers = DR_TIERS.map(t => {
        const rtoOk = rtoH >= t.rtoHours[0];
        const rpoOk = rpoH >= t.rpoHours[0];
        return { ...t, meetsRto: rtoOk, meetsRpo: rpoOk, feasible: rtoOk && rpoOk, typicalRtoHours: t.rtoHours, typicalRpoHours: t.rpoHours };
      });
      const cheapest = tiers.find(t => t.feasible);
      const transfer = a.replicationBandwidthMbps && a.dataGB ? round(a.dataGB * 8 * 1024 / a.replicationBandwidthMbps / 3600, 2) : undefined;
      return {
        ...provenance,
        kind: 'decision-table',
        workload: a.workload,
        objectives: { rtoMinutes: a.rtoMinutes, rpoMinutes: a.rpoMinutes },
        tiers,
        recommendedStartingPoint: cheapest ? `${cheapest.tier}: the lowest-cost tier whose typical range covers the objectives; confirm with a timed rehearsal` : 'No standard tier meets the objectives; revisit RTO/RPO or design active-active with explicit data partitioning',
        initialFullCopyHours: transfer,
        checks: [
          'Rehearse the failover end to end and measure real RTO; typical ranges are not evidence',
          'RPO is bounded by replication lag, not by the backup schedule alone',
          ...(a.statefulComponents.length ? [`Each stateful component needs its own replication and consistency plan: ${a.statefulComponents.join(', ')}`] : ['List stateful components; stateless tiers rarely define RTO']),
          ...(a.regulatoryResidency ? [`Recovery region must satisfy residency: ${a.regulatoryResidency}`] : []),
          'Dependencies (identity, DNS, secrets, CI/CD) must also exist in the recovery region'
        ],
        nextTools: ['failure_rehearsal', 'cost_model', 'decision_record'],
        sources: ['https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html']
      };
    }),

  tool('retry_policy',
    'Compute an exponential backoff schedule with jitter, the worst-case wait and whether it fits a deadline; adds idempotency and circuit-breaker guidance.',
    {
      baseDelayMs: z.number().positive().max(60000).default(100),
      factor: z.number().min(1).max(10).default(2),
      capMs: z.number().positive().max(600000).default(20000),
      maxAttempts: z.number().int().min(1).max(20).default(5),
      jitter: z.enum(['none', 'full', 'equal']).default('full'),
      deadlineMs: z.number().positive().max(3.6e6).optional(),
      operationIdempotent: z.boolean()
    },
    a => {
      const schedule = backoffSchedule(a.baseDelayMs, a.factor, a.capMs, a.maxAttempts - 1, a.jitter);
      let fitting = a.maxAttempts;
      if (a.deadlineMs !== undefined) {
        let acc = 0; fitting = 1;
        for (const r of schedule.rows) { if (acc + r.delayMs > a.deadlineMs) break; acc += r.delayMs; fitting++; }
      }
      return {
        kind: 'calculation',
        inputs: a,
        retriesAfterFirstAttempt: schedule.rows,
        worstCaseWaitMs: schedule.worstCaseWaitMs,
        attemptsThatFitDeadline: fitting,
        guidance: [
          a.operationIdempotent ? 'Idempotent operation: retries are safe when the server deduplicates by key' : 'NOT idempotent: do not retry blindly; verify the outcome at the target or use an idempotency key before retrying',
          a.jitter === 'none' ? 'Add jitter; synchronized retries create thundering herds' : 'Jitter spreads retries across clients',
          'Retry only on transient errors (timeouts, 429, 5xx); never on validation or authorization errors',
          'Circuit breaker: open after consecutive failures (e.g. 5) or error ratio above 50% in a window; half-open probes every cap interval',
          'Propagate the remaining deadline downstream so nested retries do not multiply'
        ],
        sources: ['https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/']
      };
    }),

  tool('storage_growth',
    'Project storage volume and relative cost over time from ingest, retention, compression, replication and growth; suggests tiering thresholds.',
    {
      dailyIngestGB: z.number().nonnegative().max(1e9),
      retentionDays: z.number().int().min(1).max(36500),
      monthlyGrowthPercent: z.number().min(-50).max(100).default(0),
      compressionRatio: z.number().min(1).max(100).default(1),
      replicationFactor: z.number().min(1).max(10).default(1),
      months: z.number().int().min(1).max(120).default(24),
      hotTierPricePerGBMonth: z.number().nonnegative().max(1000).optional(),
      coldTierPricePerGBMonth: z.number().nonnegative().max(1000).optional(),
      hotDays: z.number().int().min(0).max(36500).default(30)
    },
    a => {
      const series: { month: number; dailyIngestGB: number; storedGB: number; hotGB: number; coldGB: number; estimatedCost?: number }[] = [];
      let ingest = a.dailyIngestGB;
      const dayQueue: number[] = [];
      for (let m = 1; m <= a.months; m++) {
        for (let d = 0; d < 30; d++) { dayQueue.push(ingest / a.compressionRatio * a.replicationFactor); if (dayQueue.length > a.retentionDays) dayQueue.shift(); }
        const stored = dayQueue.reduce((s, v) => s + v, 0);
        const hot = dayQueue.slice(-Math.min(a.hotDays, dayQueue.length)).reduce((s, v) => s + v, 0);
        const cold = stored - hot;
        const cost = a.hotTierPricePerGBMonth !== undefined && a.coldTierPricePerGBMonth !== undefined ? round(hot * a.hotTierPricePerGBMonth + cold * a.coldTierPricePerGBMonth) : undefined;
        series.push({ month: m, dailyIngestGB: round(ingest, 3), storedGB: round(stored, 1), hotGB: round(hot, 1), coldGB: round(cold, 1), ...(cost !== undefined ? { estimatedCost: cost } : {}) });
        ingest *= 1 + a.monthlyGrowthPercent / 100;
      }
      const last = series[series.length - 1];
      return {
        kind: 'projection-not-quote',
        assumptions: a,
        steadyState: a.retentionDays <= a.months * 30 && a.monthlyGrowthPercent === 0,
        finalStoredGB: last.storedGB,
        finalStoredTB: round(last.storedGB / 1024, 2),
        series,
        tiering: a.hotDays < a.retentionDays ? `Move objects older than ${a.hotDays} days to a colder tier; ${round(last.coldGB / Math.max(last.storedGB, 1e-9) * 100, 1)}% of data would be cold at month ${a.months}` : 'All data stays in the hot tier; set hotDays below retention to evaluate tiering',
        limitations: ['30-day months; ignores metadata, versioning, request costs and retrieval fees', 'Growth compounds monthly on ingest, not on stored volume', 'Prices are caller-supplied; no provider rates are embedded']
      };
    }),

  tool('finops_unit_economics',
    'Compute cost per unit (request, customer, transaction), fixed versus variable split and the volume at which the marginal cost crosses a target. Caller supplies costs; no provider prices are guessed.',
    {
      period: short,
      currency: z.enum(['USD', 'BRL', 'EUR']).default('USD'),
      fixedCosts: z.array(z.object({ name: short, amount: z.number().nonnegative().max(1e12) })).max(50).default([]),
      variableCosts: z.array(z.object({ name: short, amount: z.number().nonnegative().max(1e12) })).max(50).default([]),
      units: z.array(z.object({ name: short, count: z.number().positive().max(1e15) })).min(1).max(10),
      targetCostPerPrimaryUnit: z.number().positive().max(1e9).optional()
    },
    a => {
      const fixed = a.fixedCosts.reduce((s, c) => s + c.amount, 0);
      const variable = a.variableCosts.reduce((s, c) => s + c.amount, 0);
      const total = fixed + variable;
      const primary = a.units[0];
      const perUnit = a.units.map(u => ({ unit: u.name, count: u.count, costPerUnit: round(total / u.count, 6), fixedPerUnit: round(fixed / u.count, 6), variablePerUnit: round(variable / u.count, 6) }));
      const marginal = variable / primary.count;
      let breakEvenVolume: number | null = null;
      if (a.targetCostPerPrimaryUnit !== undefined) breakEvenVolume = a.targetCostPerPrimaryUnit > marginal ? Math.ceil(fixed / (a.targetCostPerPrimaryUnit - marginal)) : null;
      return {
        kind: 'calculation',
        period: a.period,
        currency: a.currency,
        totals: { fixed: round(fixed), variable: round(variable), total: round(total), fixedSharePercent: total ? round(fixed / total * 100, 1) : 0 },
        perUnit,
        marginalCostPerPrimaryUnit: round(marginal, 6),
        breakEvenVolumeForTarget: breakEvenVolume,
        reading: [
          total && fixed / total > 0.7 ? 'Mostly fixed: unit cost falls with volume; idle capacity is the lever' : 'Mostly variable: unit cost is stable; efficiency per request is the lever',
          ...(a.targetCostPerPrimaryUnit !== undefined && breakEvenVolume === null ? ['Target is below marginal cost; no volume reaches it without reducing variable cost'] : [])
        ],
        limitations: ['Allocation is proportional and ignores shared-cost attribution rules', 'Use dated invoices or cost reports as the source for every amount']
      };
    }),

  tool('postmortem',
    'Generate a blameless postmortem document from incident facts: timeline, impact, detection, contributing factors and owned action items. Rejects action items without owner and due date.',
    {
      title: short,
      severity: z.enum(['sev1', 'sev2', 'sev3', 'sev4']),
      startedAt: z.iso.datetime(),
      detectedAt: z.iso.datetime(),
      mitigatedAt: z.iso.datetime(),
      resolvedAt: z.iso.datetime(),
      impact: text,
      timeline: z.array(z.object({ at: z.iso.datetime(), event: z.string().min(1).max(300) })).min(2).max(60),
      contributingFactors: lines,
      whatWentWell: lines.default([]),
      actionItems: z.array(z.object({ action: z.string().min(1).max(300), owner: short, due: z.iso.date(), kind: z.enum(['prevent', 'detect', 'mitigate', 'process']) })).min(1).max(30)
    },
    a => {
      const t = (s: string) => Date.parse(s);
      if (!(t(a.startedAt) <= t(a.detectedAt) && t(a.detectedAt) <= t(a.mitigatedAt) && t(a.mitigatedAt) <= t(a.resolvedAt))) throw new Error('Timestamps must be ordered: started <= detected <= mitigated <= resolved');
      const minutes = (x: string, y: string) => round((t(y) - t(x)) / 60000, 1);
      const metrics = { timeToDetectMinutes: minutes(a.startedAt, a.detectedAt), timeToMitigateMinutes: minutes(a.detectedAt, a.mitigatedAt), timeToResolveMinutes: minutes(a.startedAt, a.resolvedAt) };
      const sorted = [...a.timeline].sort((x, y) => t(x.at) - t(y.at));
      const md = `# Postmortem: ${a.title}\n\nSeverity: ${a.severity.toUpperCase()} · Blameless: focus on systems and decisions, not people.\n\n## Impact\n${a.impact}\n\n## Metrics\n- Time to detect: ${metrics.timeToDetectMinutes} min\n- Time to mitigate: ${metrics.timeToMitigateMinutes} min\n- Time to resolve: ${metrics.timeToResolveMinutes} min\n\n## Timeline (UTC)\n${sorted.map(e => `- ${e.at}: ${e.event}`).join('\n')}\n\n## Contributing factors\n${a.contributingFactors.map(f => `- ${f}`).join('\n')}\n\n## What went well\n${a.whatWentWell.length ? a.whatWentWell.map(f => `- ${f}`).join('\n') : '- (record at least one thing that worked)'}\n\n## Action items\n| Kind | Action | Owner | Due |\n|---|---|---|---|\n${a.actionItems.map(i => `| ${i.kind} | ${i.action} | ${i.owner} | ${i.due} |`).join('\n')}\n\n## Review\nSchedule a review of action items at the latest due date. Close this document only with evidence that each action shipped.\n`;
      return {
        kind: 'document',
        metrics,
        coverage: { prevent: a.actionItems.filter(i => i.kind === 'prevent').length, detect: a.actionItems.filter(i => i.kind === 'detect').length, mitigate: a.actionItems.filter(i => i.kind === 'mitigate').length, process: a.actionItems.filter(i => i.kind === 'process').length },
        warnings: [
          ...(metrics.timeToDetectMinutes > 30 ? ['Detection took more than 30 minutes; prioritize a detect action item'] : []),
          ...(!a.actionItems.some(i => i.kind === 'detect') ? ['No detection action item'] : []),
          ...(!a.actionItems.some(i => i.kind === 'prevent') ? ['No prevention action item'] : [])
        ],
        markdown: md
      };
    }),

  tool('runbook',
    'Generate an operational runbook from service facts: alerts, diagnostic steps, remediation, rollback, escalation and verification. Template with explicit placeholders for what the caller did not provide.',
    {
      service: short,
      owner: short,
      alerts: z.array(z.object({ name: short, meaning: z.string().min(1).max(300), threshold: z.string().max(120).optional() })).min(1).max(30),
      diagnostics: lines,
      remediation: lines,
      rollback: lines.default([]),
      escalation: lines.default([]),
      dashboards: z.array(z.url()).max(10).default([])
    },
    a => {
      const missing = [
        ...(a.rollback.length ? [] : ['rollback procedure']),
        ...(a.escalation.length ? [] : ['escalation path']),
        ...(a.dashboards.length ? [] : ['dashboard links'])
      ];
      const md = `# Runbook: ${a.service}\n\nOwner: ${a.owner}\n\n## Alerts\n${a.alerts.map(al => `- **${al.name}**${al.threshold ? ` (${al.threshold})` : ''}: ${al.meaning}`).join('\n')}\n\n## First 10 minutes\n1. Acknowledge the alert and open an incident channel.\n2. Check dashboards: ${a.dashboards.length ? a.dashboards.join(', ') : 'TODO: add dashboard links'}\n3. Confirm scope: which customers, regions and operations are affected.\n\n## Diagnostics\n${a.diagnostics.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\n## Remediation\n${a.remediation.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\n## Rollback\n${a.rollback.length ? a.rollback.map((d, i) => `${i + 1}. ${d}`).join('\n') : 'TODO: define how to return to the last known good version and how to verify it'}\n\n## Escalation\n${a.escalation.length ? a.escalation.map(d => `- ${d}`).join('\n') : 'TODO: define who to page after 15 minutes without progress'}\n\n## Verification\n- Error rate and latency back to baseline for 15 minutes\n- No growing backlog or retries\n- Customer-facing confirmation where applicable\n\n## After the incident\n- Record timeline and open a postmortem (tool: postmortem)\n- Update this runbook with what was missing\n`;
      return { kind: 'document', missing, markdown: md, nextTools: ['postmortem', 'failure_rehearsal'] };
    })
];
