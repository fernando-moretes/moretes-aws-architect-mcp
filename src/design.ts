import { z } from 'zod';
import { tool, text, short, lines, provenance } from './definition.js';
import equivalents from './data/equivalents.json' with { type: 'json' };

/**
 * Cloud-agnostic design tools: diagrams (C4, sequence), service equivalence
 * across providers, data classification with regulation hints, OpenAPI heuristic
 * review and event contract design. None of these call external services.
 */

type Provider = 'aws' | 'azure' | 'gcp' | 'oci' | 'oss';
type Equivalent = { category: string; capability: string; aws: string; azure: string; gcp: string; oci: string; oss: string; notes?: string };
const table = equivalents.capabilities as Equivalent[];
const PROVIDERS = ['aws', 'azure', 'gcp', 'oci', 'oss'] as const;
const providerId = z.enum(PROVIDERS);
const identifier = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/, 'Use a letter followed by letters, digits or underscore (max 40)');

/** Mermaid labels: strip characters that break or inject syntax. */
export function safeLabel(s: string, max = 160): string {
  return s.replace(/[\[\]"<>\n\r`{}|;#]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function equivalentsFor(categories: string[] | undefined, from: Provider, to: Provider[]): Record<string, unknown>[] {
  const selected = categories?.length ? table.filter(e => categories.includes(e.category)) : table;
  return selected.map(e => ({
    category: e.category,
    capability: e.capability,
    [from]: e[from],
    equivalents: Object.fromEntries(to.filter(p => p !== from).map(p => [p, e[p]])),
    ...(e.notes ? { notes: e.notes } : {})
  }));
}

const c4Element = z.object({ id: identifier, name: short, description: z.string().max(200).default(''), technology: z.string().max(80).optional() });
const c4Relation = z.object({ from: identifier, to: identifier, label: z.string().max(120).default('uses'), technology: z.string().max(80).optional() });

export const designTools = [
  tool('c4_model',
    'Build C4 context or container diagrams (Mermaid) from explicit people, systems, containers and relations. Validates endpoints; no infrastructure discovery.',
    {
      level: z.enum(['context', 'container']),
      system: short,
      people: z.array(c4Element).max(15).default([]),
      externalSystems: z.array(c4Element).max(20).default([]),
      containers: z.array(c4Element).max(30).default([]),
      relations: z.array(c4Relation).max(80).default([])
    },
    a => {
      const all = [...a.people, ...a.externalSystems, ...a.containers];
      const ids = new Set(all.map(e => e.id));
      if (ids.size !== all.length) throw new Error('Duplicate element id');
      if (a.level === 'container' && a.containers.length === 0) throw new Error('Container level requires at least one container');
      if (a.level === 'context' && a.containers.length) throw new Error('Context level takes people and external systems; move containers to level=container');
      const systemId = 'system_' + a.system.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      const known = new Set([...ids, systemId]);
      for (const r of a.relations) if (!known.has(r.from) || !known.has(r.to)) throw new Error(`Relation endpoint not declared: ${r.from} -> ${r.to}. Use "${systemId}" for the system itself at context level.`);
      const node = (e: { id: string; name: string; description: string; technology?: string }, shape: [string, string]) =>
        `  ${e.id}${shape[0]}"${safeLabel(e.name)}${e.technology ? ` [${safeLabel(e.technology, 60)}]` : ''}${e.description ? `<br/>${safeLabel(e.description, 120)}` : ''}"${shape[1]}`;
      const out: string[] = ['flowchart TB'];
      for (const p of a.people) out.push(node(p, ['([', '])']));
      if (a.level === 'context') {
        out.push(`  ${systemId}["${safeLabel(a.system)}<br/>Software system"]`);
      } else {
        out.push(`  subgraph ${systemId}["${safeLabel(a.system)}"]`);
        for (const c of a.containers) out.push('  ' + node(c, ['[', ']']));
        out.push('  end');
      }
      for (const s of a.externalSystems) out.push(node(s, ['[[', ']]']));
      for (const r of a.relations) out.push(`  ${r.from} -->|"${safeLabel(r.label, 80)}${r.technology ? ` (${safeLabel(r.technology, 40)})` : ''}"| ${r.to}`);
      const classes = [
        a.people.length ? `  classDef person fill:#1f3b63,stroke:#5b9bd5,color:#fff\n  class ${a.people.map(p => p.id).join(',')} person` : '',
        a.externalSystems.length ? `  classDef external fill:#4a4a4a,stroke:#9a9a9a,color:#fff\n  class ${a.externalSystems.map(s => s.id).join(',')} external` : ''
      ].filter(Boolean);
      return {
        ...provenance,
        level: a.level,
        mermaid: [...out, ...classes].join('\n'),
        elements: { people: a.people.length, externalSystems: a.externalSystems.length, containers: a.containers.length, relations: a.relations.length },
        unreferenced: all.filter(e => !a.relations.some(r => r.from === e.id || r.to === e.id)).map(e => e.id),
        nextLevel: a.level === 'context' ? 'Call again with level=container and the containers inside the system boundary.' : 'Describe components per container in architecture_diagram or sequence_diagram.',
        limitation: 'Logical model supplied by the caller. C4 notation: https://c4model.com/'
      };
    }),

  tool('sequence_diagram',
    'Build a Mermaid sequence diagram from participants and ordered messages, with optional activation, notes and alt/loop blocks. Rejects unknown participants.',
    {
      title: short,
      participants: z.array(z.object({ id: identifier, label: short, kind: z.enum(['actor', 'participant']).default('participant') })).min(2).max(15),
      messages: z.array(z.object({
        from: identifier, to: identifier, text: z.string().min(1).max(140),
        style: z.enum(['sync', 'async', 'reply', 'reply-async']).default('sync'),
        activate: z.boolean().default(false),
        note: z.string().max(140).optional(),
        block: z.object({ kind: z.enum(['alt', 'else', 'loop', 'opt', 'par', 'end']), label: z.string().max(80).default('') }).optional()
      })).min(1).max(60)
    },
    a => {
      const ids = new Set(a.participants.map(p => p.id));
      if (ids.size !== a.participants.length) throw new Error('Duplicate participant id');
      const arrows = { sync: '->>', async: '-)', reply: '-->>', 'reply-async': '--)' } as const;
      const out = ['sequenceDiagram', `  title ${safeLabel(a.title, 80)}`, '  autonumber'];
      for (const p of a.participants) out.push(`  ${p.kind} ${p.id} as ${safeLabel(p.label, 60)}`);
      let depth = 0;
      for (const m of a.messages) {
        if (!ids.has(m.from) || !ids.has(m.to)) throw new Error(`Unknown participant in message: ${m.from} -> ${m.to}`);
        if (m.block && m.block.kind !== 'end' && m.block.kind !== 'else') { out.push(`  ${m.block.kind} ${safeLabel(m.block.label, 60)}`); depth++; }
        if (m.block?.kind === 'else') { if (!depth) throw new Error('else without an open alt block'); out.push(`  else ${safeLabel(m.block.label, 60)}`); }
        out.push(`  ${m.from}${arrows[m.style]}${m.to}: ${safeLabel(m.text, 120)}`);
        if (m.activate) out.push(`  activate ${m.to}`);
        if (m.note) out.push(`  Note over ${m.to}: ${safeLabel(m.note, 100)}`);
        if (m.block?.kind === 'end') { if (!depth) throw new Error('end without an open block'); out.push('  end'); depth--; }
      }
      while (depth-- > 0) out.push('  end');
      const activated = a.messages.filter(m => m.activate).map(m => m.to);
      for (const id of [...new Set(activated)].reverse()) out.push(`  deactivate ${id}`);
      return { ...provenance, mermaid: out.join('\n'), messages: a.messages.length, limitation: 'Illustrates the intended interaction; it is not a trace of a real system.' };
    }),

  tool('service_equivalents',
    'Map a cloud capability to equivalent managed services on AWS, Azure, Google Cloud, OCI and open source. Names as of the snapshot date; verify current naming, regions and pricing before deciding.',
    {
      categories: z.array(z.string().max(60)).max(40).optional(),
      from: providerId.default('aws'),
      to: z.array(providerId).min(1).max(5).default(['azure', 'gcp', 'oci', 'oss']),
      query: z.string().max(100).optional()
    },
    a => {
      let categories = a.categories;
      if (a.query) {
        const q = a.query.toLowerCase();
        categories = table.filter(e => JSON.stringify(e).toLowerCase().includes(q)).map(e => e.category);
        if (!categories.length) throw new Error('No capability matched the query; call without filters to list all categories');
      }
      const unknown = (categories ?? []).filter(c => !table.some(e => e.category === c));
      if (unknown.length) throw new Error(`Unknown categories: ${unknown.join(', ')}. Available: ${table.map(e => e.category).join(', ')}`);
      return {
        kind: 'reference-snapshot',
        snapshotDate: equivalents.snapshotDate,
        from: a.from,
        rows: equivalentsFor(categories, a.from, a.to),
        categories: table.map(e => e.category),
        limitation: 'Equivalence is functional, not identical: quotas, consistency models, pricing dimensions and regional availability differ. Confirm with each provider\'s current documentation.'
      };
    }),

  tool('data_classification',
    'Classify data elements, map them to regulation hints (LGPD, GDPR, PCI DSS, HIPAA) and list handling controls and open questions. Review aid, not legal advice.',
    {
      system: short,
      elements: z.array(z.object({
        name: short,
        category: z.enum(['public', 'internal', 'personal', 'sensitive-personal', 'financial-card', 'health', 'credential', 'children']),
        purpose: z.string().max(200).default(''),
        retentionDays: z.number().int().min(0).max(36500).optional(),
        residency: z.string().max(60).optional(),
        sharedWith: z.array(short).max(10).default([])
      })).min(1).max(60),
      jurisdictions: z.array(z.enum(['BR', 'EU', 'US', 'other'])).min(1).max(4).default(['BR'])
    },
    a => {
      const controls: Record<string, string[]> = {
        public: ['Integrity protection and version history', 'No special access control beyond change approval'],
        internal: ['Authentication for access', 'Encryption in transit', 'Retention schedule'],
        personal: ['Lawful basis documented', 'Purpose limitation', 'Access control by role and tenant', 'Encryption at rest and in transit', 'Data subject rights workflow (access, correction, deletion)', 'Retention and deletion evidence', 'Processor agreements for every sharedWith party'],
        'sensitive-personal': ['Explicit legal basis for sensitive data', 'Field-level encryption or tokenization', 'Access logging with review', 'Minimization: store only what the purpose requires', 'Impact assessment before new processing'],
        'financial-card': ['Do not store PAN unless in PCI DSS scope; prefer tokenization by the payment provider', 'Never store CVV after authorization', 'Segmented network and scope documentation', 'Key management with rotation'],
        health: ['Dedicated authorization for health data', 'Audit trail of every read', 'De-identification for analytics', 'Breach notification procedure'],
        credential: ['Secrets manager, never source control or logs', 'Rotation and revocation procedure', 'Hashing with a slow algorithm for passwords', 'Least-privilege scoping'],
        children: ['Verified parental or guardian consent', 'No profiling or targeted advertising', 'Stricter minimization and deletion']
      };
      const regulation: Record<string, Record<string, string>> = {
        personal: { BR: 'LGPD art. 5 I (dado pessoal), art. 7 (bases legais), art. 18 (direitos do titular)', EU: 'GDPR art. 4(1), art. 6, art. 15-22', US: 'Sector or state laws (e.g. CCPA/CPRA); verify applicability', other: 'Verify local data protection law' },
        'sensitive-personal': { BR: 'LGPD art. 5 II e art. 11 (dado pessoal sensível)', EU: 'GDPR art. 9 (special categories)', US: 'Sector laws; verify applicability', other: 'Verify local law' },
        'financial-card': { BR: 'PCI DSS v4.0.1 (contractual) and BCB regulation for payment institutions', EU: 'PCI DSS v4.0.1 and PSD2 where applicable', US: 'PCI DSS v4.0.1 and GLBA where applicable', other: 'PCI DSS v4.0.1' },
        health: { BR: 'LGPD art. 11 and CFM/ANS rules where applicable', EU: 'GDPR art. 9', US: 'HIPAA Privacy and Security Rules where a covered entity is involved', other: 'Verify local health data law' },
        children: { BR: 'LGPD art. 14', EU: 'GDPR art. 8', US: 'COPPA', other: 'Verify local law' },
        credential: { BR: 'Security controls; LGPD art. 46 (medidas de segurança)', EU: 'GDPR art. 32', US: 'Sector requirements', other: 'Security baseline' },
        public: { BR: '-', EU: '-', US: '-', other: '-' },
        internal: { BR: '-', EU: '-', US: '-', other: '-' }
      };
      const items = a.elements.map(e => ({
        ...e,
        controls: controls[e.category],
        regulationHints: Object.fromEntries(a.jurisdictions.map(j => [j, regulation[e.category][j]])),
        questions: [
          ...(e.retentionDays === undefined ? ['Retention period and deletion trigger are undefined'] : []),
          ...(!e.residency && e.category !== 'public' ? ['Storage residency and cross-border transfer path are undefined'] : []),
          ...(!e.purpose && ['personal', 'sensitive-personal', 'health', 'children'].includes(e.category) ? ['Purpose is undefined; purpose limitation cannot be assessed'] : []),
          ...(e.sharedWith.length ? [`Confirm processor or controller agreements with: ${e.sharedWith.join(', ')}`] : [])
        ]
      }));
      const highest = ['children', 'health', 'financial-card', 'sensitive-personal', 'credential', 'personal', 'internal', 'public'].find(c => items.some(i => i.category === c));
      return {
        ...provenance,
        kind: 'data-classification-review',
        system: a.system,
        jurisdictions: a.jurisdictions,
        highestSensitivity: highest,
        items,
        summary: Object.fromEntries(Object.keys(controls).map(c => [c, items.filter(i => i.category === c).length])),
        nextTools: ['threat_model', 'well_architected_review', 'decision_record'],
        limitation: 'Regulation references are pointers for a legal or privacy review, not legal advice. Article numbers may change; verify the current text.'
      };
    }),

  tool('openapi_review',
    'Heuristic review of an OpenAPI 3.x document (JSON): security, pagination, error responses, idempotency, versioning and documentation gaps. Not a linter replacement.',
    { document: z.record(z.string(), z.unknown()) },
    a => {
      const doc = a.document;
      const version = String(doc.openapi ?? '');
      if (!version.startsWith('3.')) throw new Error('OpenAPI 3.x document required (openapi: "3.x.y")');
      const paths = (doc.paths && typeof doc.paths === 'object' ? doc.paths : {}) as Record<string, Record<string, unknown>>;
      const entries = Object.entries(paths);
      if (!entries.length) throw new Error('No paths found');
      if (entries.length > 300) throw new Error('Maximum 300 paths');
      const findings: { severity: 'high' | 'medium' | 'info'; path: string; message: string }[] = [];
      const components = (doc.components && typeof doc.components === 'object' ? doc.components : {}) as Record<string, unknown>;
      const schemes = components.securitySchemes && typeof components.securitySchemes === 'object' ? Object.keys(components.securitySchemes as object) : [];
      const globalSecurity = Array.isArray(doc.security) && doc.security.length > 0;
      if (!schemes.length) findings.push({ severity: 'high', path: 'components.securitySchemes', message: 'No security scheme declared; every operation is documented as anonymous.' });
      const servers = Array.isArray(doc.servers) ? doc.servers as { url?: string }[] : [];
      for (const [i, s] of servers.entries()) if (typeof s.url === 'string' && s.url.startsWith('http://')) findings.push({ severity: 'high', path: `servers[${i}]`, message: 'Plain HTTP server URL.' });
      if (!servers.some(s => /\/v\d+/.test(String(s.url ?? ''))) && !entries.some(([p]) => /^\/v\d+\//.test(p))) findings.push({ severity: 'info', path: 'servers', message: 'No visible version in server URL or paths; document the versioning strategy (path, header or media type).' });
      const methods = ['get', 'post', 'put', 'patch', 'delete'];
      let operations = 0;
      for (const [p, item] of entries) {
        for (const m of methods) {
          const op = item?.[m] as Record<string, unknown> | undefined;
          if (!op || typeof op !== 'object') continue;
          operations++;
          const where = `${m.toUpperCase()} ${p}`;
          const responses = (op.responses && typeof op.responses === 'object' ? op.responses : {}) as Record<string, unknown>;
          const codes = Object.keys(responses);
          const params = Array.isArray(op.parameters) ? op.parameters as { name?: string; in?: string }[] : [];
          const paramNames = params.map(x => String(x.name ?? '').toLowerCase());
          if (!op.operationId) findings.push({ severity: 'info', path: where, message: 'Missing operationId; SDK generators and tracing need stable names.' });
          if (!op.security && !globalSecurity && schemes.length) findings.push({ severity: 'medium', path: where, message: 'No security requirement on the operation and no global default.' });
          if (Array.isArray(op.security) && op.security.length === 0) findings.push({ severity: 'medium', path: where, message: 'Explicitly anonymous operation (security: []); confirm it is intentional.' });
          if (!codes.some(c => /^4/.test(c) || c === 'default')) findings.push({ severity: 'medium', path: where, message: 'No 4xx or default error response documented.' });
          if (!codes.includes('429') && !codes.includes('default')) findings.push({ severity: 'info', path: where, message: 'No 429 response; document rate limiting behavior.' });
          if (m === 'get' && !/\{[^}]+\}$/.test(p) && !paramNames.some(n => ['limit', 'page', 'pagesize', 'page_size', 'cursor', 'nexttoken', 'next_token', 'offset', 'maxresults', 'max_results'].includes(n))) findings.push({ severity: 'medium', path: where, message: 'Collection GET without pagination parameters; unbounded responses grow with data.' });
          if (m === 'post' && !paramNames.includes('idempotency-key') && !paramNames.includes('x-idempotency-key')) findings.push({ severity: 'info', path: where, message: 'POST without an Idempotency-Key header; retries may duplicate side effects.' });
          if ((m === 'put' || m === 'patch' || m === 'delete') && !paramNames.includes('if-match') && !codes.includes('412') && !codes.includes('409')) findings.push({ severity: 'info', path: where, message: 'Mutation without If-Match/ETag or 409/412; concurrent writes can overwrite each other silently.' });
          if (m !== 'get' && m !== 'delete' && !op.requestBody) findings.push({ severity: 'info', path: where, message: 'Write operation without requestBody.' });
          if (!op.summary && !op.description) findings.push({ severity: 'info', path: where, message: 'No summary or description.' });
          if (op.deprecated === true) findings.push({ severity: 'info', path: where, message: 'Deprecated operation; document sunset date and replacement.' });
        }
      }
      return {
        ...provenance,
        kind: 'openapi-heuristic-review',
        openapi: version,
        paths: entries.length,
        operations,
        securitySchemes: schemes,
        findings,
        summary: { high: findings.filter(f => f.severity === 'high').length, medium: findings.filter(f => f.severity === 'medium').length, info: findings.filter(f => f.severity === 'info').length },
        sources: ['https://spec.openapis.org/oas/v3.1.0', 'https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header'],
        limitations: ['Static subset of checks; use Spectral or vendor linters for style rules', 'Cannot evaluate authorization logic or runtime behavior', 'Empty findings is not an API approval']
      };
    }),

  tool('event_contract',
    'Design an event contract: envelope fields, schema evolution rules, idempotency, ordering, DLQ and replay decisions for a named business event. Deterministic template with open questions.',
    {
      eventName: z.string().regex(/^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)+$/, 'Use dotted PascalCase or camelCase such as orders.OrderPlaced'),
      producer: short,
      consumers: z.array(short).min(1).max(20),
      payloadFields: z.array(z.object({ name: short, type: z.enum(['string', 'number', 'integer', 'boolean', 'timestamp', 'object', 'array', 'id', 'money']), required: z.boolean().default(true), pii: z.boolean().default(false) })).min(1).max(60),
      ordering: z.enum(['none', 'per-key', 'global']).default('per-key'),
      deliveryGuarantee: z.enum(['at-least-once', 'at-most-once', 'effectively-once']).default('at-least-once')
    },
    a => {
      const names = a.payloadFields.map(f => f.name);
      if (new Set(names).size !== names.length) throw new Error('Duplicate payload field');
      const money = a.payloadFields.filter(f => f.type === 'money');
      const pii = a.payloadFields.filter(f => f.pii);
      const schema = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title: a.eventName,
        type: 'object',
        required: ['id', 'type', 'specversion', 'source', 'time', 'data'],
        properties: {
          id: { type: 'string', description: 'Unique event id; consumers deduplicate on it' },
          type: { const: a.eventName },
          specversion: { const: '1.0' },
          source: { type: 'string', description: `Producer URI, e.g. /${a.producer.replace(/\s+/g, '-').toLowerCase()}` },
          subject: { type: 'string', description: 'Aggregate or partition key for ordering' },
          time: { type: 'string', format: 'date-time' },
          dataschema: { type: 'string', description: 'URI of the versioned data schema' },
          traceparent: { type: 'string', description: 'W3C trace context for correlation' },
          data: {
            type: 'object',
            required: a.payloadFields.filter(f => f.required).map(f => f.name),
            properties: Object.fromEntries(a.payloadFields.map(f => [f.name, f.type === 'money'
              ? { type: 'object', required: ['amount', 'currency'], properties: { amount: { type: 'string', description: 'Decimal as string; never float' }, currency: { type: 'string', pattern: '^[A-Z]{3}$' } } }
              : f.type === 'timestamp' ? { type: 'string', format: 'date-time' }
              : f.type === 'id' ? { type: 'string', minLength: 1 }
              : { type: f.type }]))
          }
        }
      };
      return {
        ...provenance,
        eventName: a.eventName,
        envelope: 'CloudEvents 1.0 attributes (id, type, source, time, subject, dataschema) plus traceparent',
        jsonSchema: schema,
        rules: {
          idempotency: a.deliveryGuarantee === 'at-most-once' ? 'Producer must not retry; consumers may still see gaps.' : 'Consumers keep an idempotency store keyed by event id (TTL >= max redelivery window) and make side effects conditional.',
          ordering: a.ordering === 'none' ? 'No ordering guarantee; consumers must tolerate reordering.' : a.ordering === 'per-key' ? 'Partition by subject; a single consumer per partition preserves order per key only.' : 'Global ordering needs a single partition and limits throughput; justify it in the ADR.',
          evolution: ['Additive changes only within a major version (new optional fields)', 'Breaking change = new type suffix or dataschema major version, dual-publish during migration', 'Consumers ignore unknown fields', 'Never reuse a field name with a different meaning'],
          failure: ['Dead-letter after bounded retries with the original event and error metadata', 'Replay is an authorized operation with a time window and a target consumer, never a blind re-send', 'Poison messages are quarantined, not dropped silently']
        },
        warnings: [
          ...(money.length ? [`Money fields (${money.map(f => f.name).join(', ')}) use decimal strings plus currency; floats are rejected.`] : []),
          ...(pii.length ? [`PII fields (${pii.map(f => f.name).join(', ')}): consider referencing by id instead of embedding, define retention in the broker and in every consumer.`] : []),
          ...(a.consumers.length > 5 ? ['Many consumers: publish a consumer registry with owner and contact per subscription.'] : [])
        ],
        consumers: a.consumers.map(c => ({ consumer: c, mustDefine: ['idempotency key handling', 'retry and DLQ policy', 'schema version tolerated', 'owner'] })),
        nextTools: ['architecture_diagram', 'failure_rehearsal', 'decision_record'],
        sources: ['https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md']
      };
    })
];
