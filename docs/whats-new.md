# What's new

## 0.2.0 (2026-10-24)

The workbench grows from 24 to 48 public tools, from 4 to 20 prompts and from 3 to 18 resources. Still deterministic, still no model calls, still no account access on the public endpoint. Full list in [CHANGELOG.md](../CHANGELOG.md); per-tool guide in [tools-guide.md](tools-guide.md).

**Architect personas.** Ten roles (solution, enterprise, business, data, infrastructure and platform, software, AI, security, corporate governance and compliance, FinOps), each with a mandate, questions to ask first, checks, deliverables, tools and anti-patterns. Use them through the `architect_panel` tool, the `architect_<role>` prompts or the `moretes://personas/<id>` resources. The persona is a lens for your client's model, not a verdict. See [personas.md](personas.md).

**Cloud-agnostic design tools.** `service_equivalents` maps 43 capability categories across AWS, Azure, Google Cloud, OCI and open source from a dated snapshot. `architecture_pattern` takes a `provider` parameter and maps its services. New design tools: `c4_model` (context and container diagrams), `sequence_diagram`, `data_classification` (LGPD, GDPR, PCI DSS and HIPAA pointers, not legal advice), `openapi_review` and `event_contract` (CloudEvents envelope, evolution rules, DLQ and replay).

**Reliability and FinOps calculators.** `latency_budget`, `queue_sizing` (Little's law and Erlang C), `dr_strategy`, `retry_policy`, `storage_growth` and `finops_unit_economics`, plus document generators `postmortem` (rejects action items without owner and due date) and `runbook`. Every calculator echoes its assumptions and states its limitations; cost tools never guess provider prices.

**AI agent and MCP safety.** `agent_eval_plan`, `prompt_injection_checklist` and `rag_pipeline_plan` for putting agents in production. `mcp_server_review` reads another server's `tools/list` and flags tool poisoning, missing annotations, risky parameters and name shadowing. `mcp_config_review` checks a client configuration for unpinned packages, inline secrets, plain HTTP and auto-approved tools.

**IaC and code reviews.** `terraform_plan_review` reads `terraform show -json` output from any provider and flags replacement of stateful resources, public exposure, disabled encryption, literal credentials and unpinned providers. `kubernetes_manifest_review` checks probes, resources, security context, image pinning, host access, secrets in env, PDB and NetworkPolicy coverage. `code_review_architecture` and `dependency_manifest_review` cover source code and manifests. All heuristic: triage, not certification.

**Pipeline CLI.** `node dist/cli.js` (`moretes-architect`) runs any public tool without an MCP client: `list`, `describe`, `call` with `--input` (raw plans, templates, OpenAPI, policies, MCP configs, code files or a Kubernetes JSON array), `--format json|markdown|sarif` and `--fail-on high|medium|info`. Exit codes 0 (ok), 1 (findings at threshold), 2 (usage or input error). Runs offline for the review tools, so no quota applies. See [pipelines.md](pipelines.md).

**Per-caller quota.** Besides the global daily counter (now 3,000 requests), each caller gets 300 requests per UTC day. The caller key is `sha256(day | source IP)` truncated to 24 hex characters with a 2-day TTL; the raw IP is never stored. One heavy user can no longer exhaust the day for everyone else on their own, although the global counter is still shared. API throttle: 5 requests/s, burst 20.

**Well-known endpoints.** The public host now serves `/.well-known/mcp/server-card.json` (name, version, remote URL, tool count, privacy link for directories), `/.well-known/glama.json` and `/tools.json` (grouped inventory with descriptions and the external-call flag), next to `/` and `/health`.

**Skills and resources.** Five Markdown playbooks as resources `moretes://skills/<id>`: `architecture-review`, `adr-writing`, `agent-production-readiness`, `iac-change-review`, `cost-scenario`. Six new workflow prompts join the original four: `api_design_review`, `iac_change_review`, `agent_production_readiness`, `finops_review`, `dr_planning`, `mcp_security_review`. Real tool outputs for 42 tools are committed in `docs/examples/`.

Known limits: heuristic reviews, shared public quota, no SLA, local-only account access, no remote OAuth, no npm registry publication yet.

## 0.1.0 (2026-10-24)

Initial public architecture workbench: 24 public tools (requirements, patterns, service comparison, ADRs, Well-Architected evidence, STRIDE, failure drills, capacity, explicit-rate costs, SLO, migration, diagrams, delivery plans, agent tool contracts, IAM and CloudFormation heuristics, five AWS Knowledge adapters, integration catalog and configurations, public GitHub metadata). Optional local AWS identity, tagged inventory and cost history tools, and two allowlisted federation operations. Official AWS Knowledge connection, catalog snapshot of 61 servers with 56 pinned package configurations, HTTP and stdio transports, infrastructure, docs and tests.

Known limits: heuristic architecture reviews, shared public quota, local-only account access, provider-specific setup, no npm registry publication and no remote multi-tenant OAuth.
