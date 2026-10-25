import { z } from 'zod';
import { tool, text, short, lines, provenance } from './definition.js';

/**
 * Architect personas: each role is a lens (questions, checks, deliverables and
 * the workbench tools it leans on). The persona does not reason by itself; the
 * client model adopts the lens and uses the tools. Exposed three ways: the
 * `architect_panel` tool, one MCP prompt per role and `moretes://personas/<id>`.
 */

export type PersonaId = 'solution' | 'enterprise' | 'business' | 'data' | 'infrastructure' | 'software' | 'ai' | 'security' | 'governance' | 'finops';
export type Persona = {
  id: PersonaId;
  title: string;
  titlePt: string;
  mandate: string;
  questions: string[];
  checks: string[];
  deliverables: string[];
  tools: string[];
  antiPatterns: string[];
};

export const PERSONAS: Persona[] = [
  {
    id: 'solution', title: 'Solution Architect', titlePt: 'Arquiteto de Soluções',
    mandate: 'Turn a business problem into a deployable design with explicit trade-offs, numbers and a decision record.',
    questions: ['What outcome and who owns it?', 'Normal and peak traffic, payload sizes, growth?', 'SLO, p95 latency, RTO and RPO?', 'Data classification, residency and retention?', 'Budget per month and pricing region?', 'Team skills and existing platform constraints?'],
    checks: ['Every component has a reason that maps to a requirement', 'Two alternatives compared with evidence, not one option justified', 'Failure modes and recovery are designed, not assumed', 'Costs are a dated scenario with sources'],
    deliverables: ['Context and container diagrams', 'ADR with alternatives and consequences', 'Capacity and cost scenario', 'Implementation plan with validation gates'],
    tools: ['requirements_check', 'architecture_pattern', 'service_compare', 'service_equivalents', 'c4_model', 'capacity_plan', 'cost_model', 'decision_record', 'implementation_plan'],
    antiPatterns: ['Choosing services before requirements', 'Diagram without data flows or trust boundaries', 'Single-region by accident']
  },
  {
    id: 'enterprise', title: 'Enterprise Architect', titlePt: 'Arquiteto Enterprise',
    mandate: 'Align the design with the portfolio: capability map, standards, reuse, technical debt and the roadmap across teams.',
    questions: ['Which business capability does this serve and is it already covered elsewhere?', 'Which standards, platforms and reference architectures apply?', 'What is retired, replaced or duplicated by this change?', 'Who are the dependent teams and what is the migration path?'],
    checks: ['Capability map updated; no duplicated capability without a decision', 'Standards exceptions are recorded with an expiry', 'Integration contracts are owned and versioned', 'Debt is quantified with an owner'],
    deliverables: ['Capability mapping', 'Standards compliance and exceptions list', 'Roadmap with retirement dates', 'Decision records for exceptions'],
    tools: ['requirements_check', 'service_equivalents', 'migration_plan', 'decision_record', 'event_contract', 'implementation_plan'],
    antiPatterns: ['Standards without an exception process', 'Roadmap without retirement', 'Architecture board as a gate instead of a service']
  },
  {
    id: 'business', title: 'Business Architect', titlePt: 'Arquiteto de Negócio',
    mandate: 'Keep value, process and metrics explicit: who benefits, how the process changes and how success is measured.',
    questions: ['Which process changes and which steps disappear or move?', 'What is the unit of value and its cost today?', 'Which KPIs move and who reads them?', 'Which regulatory or contractual obligations attach to the process?'],
    checks: ['Each feature traces to a measurable outcome', 'Process owners agreed on the new flow', 'Unit economics are modeled before build', 'Compliance obligations are mapped to controls'],
    deliverables: ['Value stream and process impact', 'KPI definitions with baselines', 'Unit economics scenario', 'Stakeholder and obligation map'],
    tools: ['requirements_check', 'finops_unit_economics', 'data_classification', 'decision_record'],
    antiPatterns: ['Technology project without a process owner', 'KPIs defined after launch', 'Ignoring the cost of the current process']
  },
  {
    id: 'data', title: 'Data Architect', titlePt: 'Arquiteto de Dados',
    mandate: 'Design how data is modeled, stored, moved, governed and retired, with ownership and quality explicit.',
    questions: ['Who owns each dataset and its quality?', 'Access patterns: reads, writes, analytics, retention?', 'Consistency and freshness requirements per consumer?', 'Lineage, classification and deletion obligations?'],
    checks: ['Storage chosen from access patterns, not habit', 'Schemas versioned with evolution rules', 'Classification drives encryption, residency and retention', 'Growth and cost projected with tiering'],
    deliverables: ['Logical data model and ownership', 'Event or API contracts', 'Classification and retention matrix', 'Storage growth and cost projection'],
    tools: ['service_compare', 'service_equivalents', 'data_classification', 'event_contract', 'storage_growth', 'rag_pipeline_plan', 'decision_record'],
    antiPatterns: ['One database for every access pattern', 'PII copied into analytics without classification', 'Schema changes without consumers knowing']
  },
  {
    id: 'infrastructure', title: 'Infrastructure and Platform Architect', titlePt: 'Arquiteto de Infraestrutura e Plataforma',
    mandate: 'Make the platform reproducible, observable and recoverable: IaC, networking, identity, capacity and DR.',
    questions: ['Is everything reproducible from code, including identity and DNS?', 'Blast radius of a region, account or cluster failure?', 'Capacity headroom and quotas?', 'How is a change rolled back and verified?'],
    checks: ['IaC plan reviewed for destructive changes', 'Network exposure is explicit and minimal', 'Backups restored in a rehearsal, not only taken', 'Observability covers the golden signals'],
    deliverables: ['Reviewed IaC plan', 'DR tier decision with rehearsal evidence', 'Capacity and queue sizing', 'Runbooks per alert'],
    tools: ['terraform_plan_review', 'cloudformation_review', 'kubernetes_manifest_review', 'capacity_plan', 'queue_sizing', 'dr_strategy', 'failure_rehearsal', 'runbook'],
    antiPatterns: ['Manual changes in the console', 'Backups never restored', 'Alerts without runbooks']
  },
  {
    id: 'software', title: 'Software Architect', titlePt: 'Arquiteto de Software',
    mandate: 'Keep the codebase evolvable: boundaries, contracts, error handling, idempotency, testing and dependency hygiene.',
    questions: ['Where are the module boundaries and who owns them?', 'How are errors, retries and timeouts handled across calls?', 'Which operations are idempotent and how is that enforced?', 'How are dependencies pinned, updated and audited?'],
    checks: ['Public contracts (API, events) are versioned and reviewed', 'Retries only on idempotent or keyed operations', 'No secrets or environment-specific values in code', 'Tests cover failure paths, not only happy paths'],
    deliverables: ['Sequence diagrams for critical flows', 'API and event contract reviews', 'Code review findings with severity', 'Dependency and retry policy'],
    tools: ['sequence_diagram', 'openapi_review', 'event_contract', 'code_review_architecture', 'dependency_manifest_review', 'retry_policy', 'latency_budget'],
    antiPatterns: ['Distributed monolith', 'Retry storms', 'Shared mutable database between services']
  },
  {
    id: 'ai', title: 'AI Architect', titlePt: 'Arquiteto de IA',
    mandate: 'Put models and agents in production with grounding, authorization, evaluation and cost under control.',
    questions: ['What does the model decide and what does it only suggest?', 'Which tools can mutate state and who approves?', 'How is quality measured before and after release?', 'Where does untrusted content enter the prompt?'],
    checks: ['Tool authorization separated from model output', 'Eval set with adversarial cases runs on every change', 'Retrieval authorized before top-k, citations required', 'Cost per task and step limits enforced'],
    deliverables: ['Agent tool contracts', 'Evaluation plan and red-team cases', 'RAG pipeline plan', 'Prompt-injection control checklist'],
    tools: ['agent_tool_contract', 'agent_eval_plan', 'prompt_injection_checklist', 'rag_pipeline_plan', 'mcp_server_review', 'mcp_config_review', 'service_equivalents'],
    antiPatterns: ['Model output used as authorization', 'Evals only at launch', 'Unbounded agent loops']
  },
  {
    id: 'security', title: 'Security Architect', titlePt: 'Arquiteto de Segurança',
    mandate: 'Make trust boundaries, identities, secrets and detection explicit; assume compromise and bound the blast radius.',
    questions: ['Who or what authenticates to each component and with which lifetime?', 'Where are the trust boundaries and what crosses them?', 'How are secrets issued, rotated and revoked?', 'What is detected, by whom, in how long?'],
    checks: ['STRIDE applied per boundary', 'Least privilege verified in policies, not assumed', 'No long-lived static credentials', 'Logging excludes secrets and includes identity and outcome'],
    deliverables: ['Threat model', 'IAM and IaC policy findings', 'Data classification controls', 'Detection and response expectations'],
    tools: ['threat_model', 'iam_policy_review', 'cloudformation_review', 'terraform_plan_review', 'kubernetes_manifest_review', 'data_classification', 'mcp_server_review', 'code_review_architecture'],
    antiPatterns: ['Wildcard IAM to make it work', 'Secrets in environment files', 'Security review after the design is frozen']
  },
  {
    id: 'governance', title: 'Corporate Governance and Compliance Architect', titlePt: 'Arquiteto de Governança Corporativa e Compliance',
    mandate: 'Map obligations to controls and evidence: regulation, audit, risk appetite and accountability across the organization.',
    questions: ['Which laws, regulators and contracts apply to this system and data?', 'What evidence will an auditor ask for and where does it live?', 'Who is accountable for each control?', 'What is the approval and exception workflow?'],
    checks: ['Obligations mapped to controls with owners', 'Evidence produced automatically where possible', 'Exceptions time-boxed and reviewed', 'Vendor and third-party risk documented'],
    deliverables: ['Obligation-to-control matrix', 'Evidence plan', 'Risk register entries', 'Decision records for exceptions'],
    tools: ['data_classification', 'well_architected_review', 'threat_model', 'decision_record', 'implementation_plan'],
    antiPatterns: ['Controls documented but never evidenced', 'Compliance as a one-time project', 'Unknown data processors']
  },
  {
    id: 'finops', title: 'FinOps Architect', titlePt: 'Arquiteto FinOps',
    mandate: 'Make cost a design input: unit economics, allocation, commitments, waste and the levers per component.',
    questions: ['What is the unit of value and its target cost?', 'Which costs are fixed versus variable with traffic?', 'How is cost allocated to teams and products?', 'Which levers exist: rightsizing, tiering, commitments, architecture change?'],
    checks: ['Every cost line has a dated source', 'Budgets and alerts exist before launch', 'Storage tiering and retention decided', 'Idle capacity measured'],
    deliverables: ['Dated cost scenario', 'Unit economics and break-even', 'Storage growth projection', 'Allocation and tagging requirements'],
    tools: ['cost_model', 'finops_unit_economics', 'storage_growth', 'capacity_plan', 'queue_sizing', 'service_equivalents'],
    antiPatterns: ['Cost reviewed only at invoice time', 'Commitments bought before rightsizing', 'Untagged resources']
  }
];

const personaIds = PERSONAS.map(p => p.id) as [PersonaId, ...PersonaId[]];
export const personaId = z.enum(personaIds);
export const personaById = (id: PersonaId) => PERSONAS.find(p => p.id === id)!;

export function personaPrompt(p: Persona): string {
  return `Act as the ${p.title} on this workbench. Mandate: ${p.mandate}\n\nFirst ask, do not assume: ${p.questions.join(' ')}\n\nThen use these tools, in this order of need: ${p.tools.join(', ')}. Separate current external evidence (aws_knowledge_search and sources the user provides) from heuristics. Check: ${p.checks.join('; ')}.\n\nDeliver: ${p.deliverables.join('; ')}. Call out these anti-patterns when you see them: ${p.antiPatterns.join('; ')}. State assumptions, limitations and what still needs evidence. Never present a heuristic result as a certification, and never deploy or change anything.`;
}

const ARTIFACTS = ['requirements', 'design', 'code', 'iac', 'api-contract', 'data-model', 'pipeline', 'incident'] as const;

export const personaTools = [
  tool('architect_panel',
    'Convene architect personas (solution, enterprise, business, data, infrastructure, software, AI, security, governance, FinOps) on a subject: each returns its questions, checks, deliverables and the workbench tools to call. Lens, not a verdict.',
    {
      subject: text,
      artifactType: z.enum(ARTIFACTS),
      roles: z.array(personaId).min(1).max(10).default(['solution', 'security', 'finops']),
      knownFacts: lines.default([])
    },
    a => {
      const roles = [...new Set(a.roles)].map(personaById);
      const focus: Record<typeof a.artifactType, string[]> = {
        requirements: ['requirements_check', 'data_classification', 'finops_unit_economics'],
        design: ['c4_model', 'service_compare', 'threat_model', 'well_architected_review', 'cost_model'],
        code: ['code_review_architecture', 'dependency_manifest_review', 'sequence_diagram', 'retry_policy'],
        iac: ['terraform_plan_review', 'cloudformation_review', 'kubernetes_manifest_review', 'iam_policy_review'],
        'api-contract': ['openapi_review', 'event_contract', 'latency_budget'],
        'data-model': ['data_classification', 'event_contract', 'storage_growth', 'service_compare'],
        pipeline: ['terraform_plan_review', 'dependency_manifest_review', 'mcp_config_review', 'implementation_plan'],
        incident: ['postmortem', 'runbook', 'failure_rehearsal', 'slo_budget']
      };
      return {
        ...provenance,
        kind: 'architect-panel',
        subject: a.subject,
        artifactType: a.artifactType,
        knownFacts: a.knownFacts,
        panel: roles.map(p => ({
          role: p.id, title: p.title, titlePt: p.titlePt, mandate: p.mandate,
          askFirst: p.questions.filter(q => !a.knownFacts.some(f => f.toLowerCase().includes(q.toLowerCase().split(' ')[0]))),
          checks: p.checks,
          toolsToCall: [...new Set([...p.tools.filter(t => focus[a.artifactType].includes(t)), ...p.tools])].slice(0, 6),
          deliverables: p.deliverables,
          antiPatterns: p.antiPatterns
        })),
        synthesis: ['Resolve conflicts between roles explicitly (e.g. cost versus resilience) in a decision_record', 'Every finding needs an owner, evidence and a validation criterion', 'Unknown stays unknown; do not fill gaps with assumptions'],
        availableRoles: PERSONAS.map(p => ({ id: p.id, title: p.title })),
        howToUse: 'Use the matching MCP prompt (architect_<role>) to make the client model adopt one lens, then call the listed tools with real inputs.'
      };
    }),

  tool('code_review_architecture',
    'Heuristic architecture and security scan of source code pasted as text (any language): secrets, insecure calls, SQL built by concatenation, disabled TLS, hardcoded endpoints, missing timeouts and retry hazards. Not a linter or SAST replacement.',
    {
      filename: z.string().max(200).default('snippet'),
      language: z.enum(['auto', 'typescript', 'javascript', 'python', 'java', 'go', 'csharp', 'kotlin', 'ruby', 'php', 'rust', 'shell', 'yaml', 'json', 'hcl', 'sql']).default('auto'),
      code: z.string().min(1).max(60000)
    },
    a => {
      const lines = a.code.split('\n');
      if (lines.length > 3000) throw new Error('Maximum 3000 lines per call; split the file');
      const findings: { severity: 'high' | 'medium' | 'info'; line: number; rule: string; message: string }[] = [];
      const rules: [RegExp, 'high' | 'medium' | 'info', string, string][] = [
        [/(AKIA|ASIA)[0-9A-Z]{16}/, 'high', 'aws-access-key', 'AWS access key id literal.'],
        [/-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/, 'high', 'private-key', 'Private key material in source.'],
        [/(password|passwd|secret|api[_-]?key|token|client_secret)\s*[:=]\s*["'][^"'\s]{8,}["']/i, 'high', 'hardcoded-secret', 'Credential-like literal assigned in code.'],
        [/\b(eval|exec)\s*\(/, 'high', 'dynamic-eval', 'Dynamic code evaluation.'],
        [/shell\s*=\s*True|child_process\.exec\(|os\.system\(|Runtime\.getRuntime\(\)\.exec\(/, 'high', 'shell-exec', 'Shell command execution; prefer argument arrays and allowlists.'],
        [/(verify\s*=\s*False|rejectUnauthorized\s*:\s*false|InsecureSkipVerify\s*:\s*true|CURLOPT_SSL_VERIFYPEER,\s*(0|false))/i, 'high', 'tls-disabled', 'TLS verification disabled.'],
        [/(SELECT|INSERT|UPDATE|DELETE)\b[^;\n]*(\+\s*[a-zA-Z_]|\$\{|%s|f["'])/i, 'high', 'sql-concat', 'SQL statement built by string interpolation; use parameters.'],
        [/["']http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[^"'\s]+["']/, 'medium', 'plain-http', 'Plain HTTP endpoint literal.'],
        [/\b(\d{1,3}\.){3}\d{1,3}\b(?![\d.])/, 'info', 'hardcoded-ip', 'Hardcoded IP address.'],
        [/(fetch|axios|requests\.(get|post|put|delete)|http\.(Get|Post)|HttpClient)\b(?![^\n]*(timeout|signal|AbortSignal|Timeout))/i, 'medium', 'no-timeout', 'Network call without a visible timeout on the same line; verify a client-level timeout exists.'],
        [/while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/, 'info', 'infinite-loop', 'Unbounded loop; confirm an exit condition and a step limit.'],
        [/\bretry|retries|backoff\b/i, 'info', 'retry-present', 'Retry logic present; confirm the operation is idempotent (tool: retry_policy).'],
        [/catch\s*(\([^)]*\))?\s*\{\s*\}/, 'medium', 'swallowed-error', 'Empty catch block swallows errors.'],
        [/console\.log\(|print\(|System\.out\.println\(/, 'info', 'debug-output', 'Debug output; route through structured logging without secrets.'],
        [/(TODO|FIXME|HACK)\b/, 'info', 'todo', 'Unresolved marker.'],
        [/Access-Control-Allow-Origin["']?\s*[:=,]\s*["']\*/i, 'medium', 'cors-wildcard', 'CORS wildcard origin.'],
        [/(0\.0\.0\.0\/0|::\/0)/, 'medium', 'open-cidr', 'Internet-wide CIDR.'],
        [/"Action"\s*:\s*"\*"|Action\s*=\s*\[?"\*"/, 'high', 'iam-wildcard', 'Wildcard IAM action.'],
        [/(md5|sha1)\s*\(/i, 'info', 'weak-hash', 'Weak hash for anything security-related.'],
        [/Math\.random\(\)|random\.random\(\)/, 'info', 'weak-random', 'Non-cryptographic randomness; fine for jitter, not for tokens.']
      ];
      lines.forEach((text, i) => {
        if (text.length > 2000) return;
        for (const [re, severity, rule, message] of rules) if (re.test(text)) findings.push({ severity, line: i + 1, rule, message });
      });
      const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
      const metrics = { lines: lines.length, nonEmptyLines: lines.filter(l => l.trim()).length, longestLine: longest, functionsApprox: (a.code.match(/\b(function|def|func|fn|public|private|protected)\b[^\n]*\(/g) ?? []).length, todoCount: findings.filter(f => f.rule === 'todo').length };
      const bySeverity = { high: findings.filter(f => f.severity === 'high').length, medium: findings.filter(f => f.severity === 'medium').length, info: findings.filter(f => f.severity === 'info').length };
      return {
        ...provenance,
        kind: 'code-heuristic-review',
        filename: a.filename,
        language: a.language,
        metrics,
        findings: findings.slice(0, 200),
        truncated: findings.length > 200,
        summary: bySeverity,
        architectureQuestions: ['Where do timeouts, retries and idempotency live for every outbound call?', 'Which configuration differs per environment and how is it injected?', 'How does this code fail when a dependency is down?', 'Which secrets does it need and from where?'],
        limitations: ['Regex heuristics per line; no parsing, data flow or semantic analysis', 'Use Semgrep, CodeQL, Bandit, gosec or the language linter for enforcement', 'A match may be a false positive (e.g. a documented example)']
      };
    }),

  tool('dependency_manifest_review',
    'Review a dependency manifest (package.json, requirements.txt, pyproject, go.mod, pom.xml, Gemfile, Cargo.toml as text) for unpinned ranges, git or URL sources, wildcard versions and missing lockfile hints.',
    {
      filename: short,
      content: z.string().min(1).max(60000),
      lockfilePresent: z.boolean().optional()
    },
    a => {
      const findings: { severity: 'high' | 'medium' | 'info'; target: string; message: string }[] = [];
      const name = a.filename.toLowerCase();
      let dependencies = 0;
      if (name.endsWith('package.json')) {
        let pkg: Record<string, unknown>;
        try { pkg = JSON.parse(a.content) as Record<string, unknown>; } catch { throw new Error('package.json is not valid JSON'); }
        for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
          const deps = pkg[section] && typeof pkg[section] === 'object' ? pkg[section] as Record<string, string> : {};
          for (const [dep, v] of Object.entries(deps)) {
            dependencies++;
            if (v === '*' || v === 'latest' || v === '') findings.push({ severity: 'high', target: `${section}.${dep}`, message: `Version "${v || 'empty'}" accepts anything.` });
            else if (/^(git\+|github:|https?:|file:)/.test(v) || /\.git(#|$)/.test(v)) findings.push({ severity: 'medium', target: `${section}.${dep}`, message: 'Git, URL or file source; pin to a commit hash and review the code.' });
            else if (/^[\^~>]/.test(v) && section === 'dependencies' && a.lockfilePresent === false) findings.push({ severity: 'medium', target: `${section}.${dep}`, message: `Range "${v}" without a lockfile resolves differently over time.` });
            else if (/^[\^~>]/.test(v) && section === 'dependencies') findings.push({ severity: 'info', target: `${section}.${dep}`, message: `Range "${v}"; the lockfile pins it, confirm installs use it (npm ci / pnpm --frozen-lockfile).` });
          }
        }
        const scripts = pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts as Record<string, string> : {};
        for (const s of ['preinstall', 'install', 'postinstall']) if (scripts[s]) findings.push({ severity: 'medium', target: `scripts.${s}`, message: `Lifecycle script runs on install: ${scripts[s].slice(0, 80)}` });
        if (!pkg.engines) findings.push({ severity: 'info', target: 'engines', message: 'No engines field; runtime version drifts between machines.' });
      } else if (name.endsWith('requirements.txt') || name.endsWith('.in')) {
        for (const raw of a.content.split('\n')) {
          const line = raw.trim();
          if (!line || line.startsWith('#') || line.startsWith('-')) continue;
          dependencies++;
          if (/^(git\+|https?:)/.test(line)) findings.push({ severity: 'medium', target: line.slice(0, 60), message: 'URL or VCS source; pin to a commit and prefer a registry release.' });
          else if (!/==|@/.test(line)) findings.push({ severity: /[<>~]/.test(line) ? 'info' : 'medium', target: line.split(/[<>=~!\[; ]/)[0], message: /[<>~]/.test(line) ? 'Range specifier; use a compiled lock (pip-tools, uv lock) for deploys.' : 'No version specifier at all.' });
          if (/--hash=/.test(line)) { /* hashed install: good */ }
        }
        if (dependencies && !/--hash=/.test(a.content)) findings.push({ severity: 'info', target: 'file', message: 'No hashes; consider pip-compile --generate-hashes or uv lock for supply-chain integrity.' });
      } else if (name.endsWith('pyproject.toml') || name.endsWith('cargo.toml') || name.endsWith('gemfile') || name.endsWith('go.mod') || name.endsWith('pom.xml') || name.endsWith('build.gradle') || name.endsWith('build.gradle.kts')) {
        const text = a.content;
        const unpinned = text.match(/^[^#\n]*(\*|latest|LATEST|RELEASE)["']?\s*$/gm) ?? [];
        for (const u of unpinned.slice(0, 50)) findings.push({ severity: 'high', target: u.trim().slice(0, 80), message: 'Wildcard or floating version.' });
        const vcs = text.match(/^[^#\n]*(git\s*=|github\.com\/[^"\s]+\s+v0\.0\.0-|:git\b)[^\n]*/gm) ?? [];
        for (const g of vcs.slice(0, 50)) findings.push({ severity: 'medium', target: g.trim().slice(0, 80), message: 'VCS source; pin to a tag or commit.' });
        if (name.endsWith('pom.xml') && /<version>\s*\$\{[^}]+\}\s*<\/version>/.test(text) && !/<dependencyManagement>/.test(text)) findings.push({ severity: 'info', target: 'pom.xml', message: 'Property-based versions without dependencyManagement; verify a BOM pins transitive versions.' });
        if (name.endsWith('go.mod') && !/^go \d/m.test(text)) findings.push({ severity: 'info', target: 'go.mod', message: 'No go directive.' });
        dependencies = (text.match(/^\s*[A-Za-z0-9_.\-\/"']+\s*(=|:|@)|<dependency>|^\s*(gem|require)\s/gm) ?? []).length;
      } else throw new Error('Unsupported manifest; supported: package.json, requirements.txt, pyproject.toml, Cargo.toml, Gemfile, go.mod, pom.xml, build.gradle');
      if (a.lockfilePresent === false) findings.push({ severity: 'medium', target: 'lockfile', message: 'No lockfile committed; builds are not reproducible.' });
      return {
        ...provenance,
        kind: 'dependency-heuristic-review',
        filename: a.filename,
        dependencies,
        findings,
        summary: { high: findings.filter(f => f.severity === 'high').length, medium: findings.filter(f => f.severity === 'medium').length, info: findings.filter(f => f.severity === 'info').length },
        rules: ['Pin in the lockfile, update on a schedule with a changelog read', 'Run a vulnerability audit in CI (npm audit, pip-audit, osv-scanner, govulncheck)', 'Review lifecycle scripts and VCS sources before adopting a package', 'Generate an SBOM for releases'],
        limitations: ['Text heuristics; no registry lookup, vulnerability data or transitive resolution', 'Pair with osv-scanner or the ecosystem audit tool']
      };
    })
];
