<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/hero-dark.svg">
    <img alt="Moretes Architect MCP" src="images/hero-light.svg" width="100%">
  </picture>
</p>

# Moretes Architect MCP (English)

**Evidence-first architecture, for any cloud, inside your coding agent.**

An MCP server that puts **48 deterministic architecture tools** and **10 architect personas** inside Claude Code, Codex, Kiro, Cursor, VS Code, Gemini CLI, Amazon Q and any MCP client. Your client's model reasons; the server returns calculations, structures, official sources and explicit gaps. **The server never calls a model**, never touches your account over the internet and needs no API key.

Built by [Fernando Azevedo](https://fernando.moretes.com), Specialist IT Architect and AWS Community Builder (AI Engineering). Video course and FAQ at [fernando.moretes.com/mcp](https://fernando.moretes.com/mcp) (bilingual, switch to English with the language toggle).

## See it working

It asks before suggesting: `requirements_check`, then `architect_panel`.

<img alt="Claude Code calling requirements_check and architect_panel" src="images/ide-requirements-panel.gif" width="100%">

It calculates instead of guessing: `latency_budget` in Kiro.

<img alt="Kiro calling latency_budget" src="images/ide-latency-budget.gif" width="100%">

It stops a dangerous apply in CI: the same engine as an offline CLI with SARIF and exit codes.

<img alt="CLI running terraform_plan_review" src="images/cli-terraform-review.gif" width="100%">

## Connect in 30 seconds

```sh
claude mcp add --transport http moretes-architect https://mcp.moretes.com/mcp
codex mcp add moretes-architect --url https://mcp.moretes.com/mcp
gemini mcp add --transport http moretes-architect https://mcp.moretes.com/mcp
```

Kiro, Cursor, Amazon Q: `{"mcpServers":{"moretes-architect":{"url":"https://mcp.moretes.com/mcp"}}}`. VS Code: `{"servers":{"moretes-architect":{"type":"http","url":"..."}}}`. Every client step by step: [clients.md](clients.md).

Public quota: 300 requests per day per caller, 3,000 in total. No SLA. For volume or private inputs, run locally:

Install the published release with an explicit binary:

```sh
npx --yes --package moretes-aws-architect-mcp@0.4.1 moretes-architect list
npx --yes --package moretes-aws-architect-mcp@0.4.1 moretes-aws-architect-mcp
```

The second command starts MCP stdio. Installation uses the network; deterministic review/calculation tools run offline afterward. Source builds remain available:

```sh
git clone https://github.com/fernando-moretes/moretes-aws-architect-mcp.git
cd moretes-aws-architect-mcp && npm ci --ignore-scripts && npm run build
node dist/stdio.js          # MCP over stdio
node dist/cli.js list       # pipeline CLI
```

## What it does

Release 0.4.1 fixes large-queue numerical overflow and makes GitHub Action report-only mode fail on execution errors. See [release notes](release-notes.md) and [integration setup](integrations-clients.md). Queue calculations accept at most 100,000 concurrent slots; errors are explicit, never silently reported as successful reviews.

| Group | Tools |
|---|---|
| Personas and code | `architect_panel`, `code_review_architecture`, `dependency_manifest_review` |
| Architecture and decisions | `requirements_check`, `architecture_pattern`, `service_compare`, `decision_record`, `well_architected_review`, `threat_model`, `failure_rehearsal`, `capacity_plan`, `cost_model`, `slo_budget`, `migration_plan`, `architecture_diagram`, `implementation_plan`, `agent_tool_contract` |
| Design: diagrams, data, contracts | `c4_model`, `sequence_diagram`, `service_equivalents`, `data_classification`, `openapi_review`, `event_contract` |
| Reliability, operations and FinOps | `latency_budget`, `queue_sizing`, `dr_strategy`, `retry_policy`, `storage_growth`, `finops_unit_economics`, `postmortem`, `runbook` |
| AI agents and MCP safety | `agent_eval_plan`, `prompt_injection_checklist`, `rag_pipeline_plan`, `mcp_server_review`, `mcp_config_review` |
| Infrastructure as code | `iam_policy_review`, `cloudformation_review`, `terraform_plan_review`, `kubernetes_manifest_review` |
| Live AWS Knowledge | `aws_knowledge_search`, `aws_knowledge_read`, `aws_regions`, `aws_regional_availability`, `aws_skill` |
| Official integrations and GitHub | `integration_catalog`, `integration_config`, `github_public_repository` |

Plus 20 prompts (10 workflows, one `architect_<role>` per persona), 18 resources and, in local mode only, 5 opt-in AWS account and federation tools. Heuristic reviews are triage, never certification. Guides: [tools](tools-guide.md), [personas](personas.md), [pipelines](pipelines.md), [FAQ](faq.md), [troubleshooting](troubleshooting.md), [glossary](glossary.md). Real outputs: [examples](examples).

## Privacy

The public server processes input in memory and logs only request id, status and duration. Only `aws_knowledge_*` (official AWS Knowledge MCP) and `github_public_repository` (api.github.com) reach the internet. The per-caller quota key is `sha256(day + IP)`; the raw IP is not stored. Details: [PRIVACY.md](../PRIVACY.md), [SECURITY.md](../SECURITY.md).

Independent project. Not an AWS product, official Well-Architected review, security certification or price quote. MIT licensed. Issues and PRs welcome in English or Portuguese.
