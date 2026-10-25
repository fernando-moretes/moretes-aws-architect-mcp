# Moretes AWS Architect MCP — English guide

An independent open-source architecture workbench by Fernando Azevedo. Connect it to Codex, Claude or Kiro through Streamable HTTP, or run locally over stdio.

The host model performs reasoning. Tools provide structured design artifacts, deterministic calculations and live official AWS sources. No paid model is invoked by this server.

## What works

- 24 public tools: requirements, architecture patterns, service comparisons, ADRs, Well-Architected evidence, threat review, failure drills, sizing, explicit-rate costs, SLOs, migration plans, diagrams, delivery plans, agent authorization contracts, IAM/CloudFormation heuristics, five AWS Knowledge adapters, integration catalog/configs and public GitHub metadata.
- Three opt-in local authenticated AWS tools: identity, tagged resources and cost history.
- Two optional local federation tools: inspect and call exact allowlisted tools in installed official AWS MCP packages.
- Four workflow prompts and three reference resources.
- Snapshot of 61 distinct AWS servers, with 56 version-pinned package configurations. Catalog entries are **not** claims of tested runtime integrations.

## Getting started

See [deployment status and endpoint](deployment.md) and [client configurations](clients.md).

```sh
npm ci --ignore-scripts
npm test
npm run build
npm start
```

Try: “Ask me about traffic, latency, data classification, recovery objectives and budget. Compare Lambda and ECS, verify current AWS documentation, draw the architecture and prepare an ADR with unresolved assumptions.”

The public endpoint cannot use your AWS account. Use local stdio with a dedicated profile, `ENABLE_AWS_ACCOUNT_TOOLS=true`, `EXPECTED_AWS_ACCOUNT_ID` and `AWS_REGION=us-east-1` for account operations. Do not submit confidential data to the public service. External documentation queries still go to AWS Knowledge.

The service is stateless with a shared daily quota. Review tools are heuristics, not certification. Costs are explicit-input scenarios, not quotes. Local provider calls can mutate resources and incur costs; the dispatcher must not be auto-approved. No remote account OAuth or automatic deployment is implemented.

[Architecture](architecture.md) · [Integration boundaries](integrations.md) · [Costs](costs.md) · [Runbook](operations.md) · [Workshop](workshop.md) · [Security](../SECURITY.md).
