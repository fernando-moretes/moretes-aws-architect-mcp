# Deployment and validation

Release **0.4.1**, prepared 26 October and verified 27 October 2026 (America/Sao_Paulo). The GitHub release and tag workflows record the immutable build/publishing results; this file describes the validation gates and the historical evidence separately.

## Confirmed release evidence

- [PR #15](https://github.com/fernando-moretes/moretes-aws-architect-mcp/pull/15) merged at `6c08891`; CI on Node 22/24, CodeQL and real Action self-tests passed.
- [npm and MCP Registry publication](https://github.com/fernando-moretes/moretes-aws-architect-mcp/actions/runs/40441540914) completed successfully. npm 0.4.1 has a provenance attestation; Registry 0.4.1 is active and advertises `https://mcp.moretes.com/mcp`.
- [Container publication](https://github.com/fernando-moretes/moretes-aws-architect-mcp/actions/runs/40441540855) completed for linux/amd64 and linux/arm64. Image index: `sha256:c583817f36c67abb75c33a8136d035530543bc7df4fd13c6d05585155ddf8383`.
- `npm run package:smoke -- --package moretes-aws-architect-mcp@0.4.1` passed against the published package, including both bins, SDK stdio discovery, the large-queue regression and default account-tool isolation.
- A reviewed CloudFormation change set updated Lambda code and its dependent integration reference only. Existing domain, certificate, quotas and budget parameters were preserved; the stack reached `UPDATE_COMPLETE`.
- Live SDK smoke at the canonical endpoint confirmed version 0.4.1, 48 tools, 20 prompts, 18 resources, capacity calculation, large-queue regression, live AWS Knowledge search and rejection of account identity access.
- `CLAUDE.md` is the machine-local handoff, intentionally excluded by `.git/info/exclude`; public operational guidance is maintained in the tracked documentation.

## Service and distribution

- Landing: https://mcp.moretes.com/
- MCP: https://mcp.moretes.com/mcp
- Health: https://mcp.moretes.com/health
- Inventory: https://mcp.moretes.com/tools.json
- Aggregate calls: https://mcp.moretes.com/stats.json
- GitHub release: https://github.com/fernando-moretes/moretes-aws-architect-mcp/releases/tag/v0.4.1
- npm: https://www.npmjs.com/package/moretes-aws-architect-mcp/v/0.4.1
- MCP Registry ID: `io.github.fernando-moretes/moretes-aws-architect-mcp`
- GHCR: `ghcr.io/fernando-moretes/moretes-aws-architect-mcp:0.4.1`

The custom domain introduced in 0.4.0 uses regional API Gateway, an ACM certificate and the existing DNS-only CNAME. The original execute-api URL remains compatible. Deployment region: us-east-1. Stacks: `moretes-architect-mcp` and `moretes-architect-mcp-artifacts`.

## Reproducible release checks

| Check | Evidence produced |
| --- | --- |
| `npm run typecheck`, `npm run build` | Strict TypeScript and Lambda bundle |
| `npm test` | 50 tests; high-load numerical references, bounded capacity, Action error propagation, protocol/input/isolation and reproducible examples |
| `npm run contracts` + clean diff | 48 name/description/input hashes and 42 example-based output schemas |
| `npm run docs:check` | Release manifest consistency and local Markdown/image links |
| `npm run package:smoke` | Fresh tarball install, both bins, CLI/stdio queue regression and account-tool rejection |
| `npm audit --omit=dev` | Known runtime dependency advisories at execution time |
| GitHub CI, CodeQL, Action self-test | Node 22/24 plus actual composite Action outcomes |
| Publish and Container tag workflows | npm/Registry, SBOM, amd64/arm64 images and provenance |
| `npm run smoke -- https://mcp.moretes.com/mcp` | Exact version, 48 tools, queue and capacity calculations, live AWS Knowledge, account isolation, 18 resources and 20 prompts |

A source build, npm release, container publication and AWS deployment are separate events. Check each result before claiming it complete. `GET /health` alone does not test upstream availability. Tests do not constitute a full security audit or proof of every IDE/provider combination.

## Historical provider evidence

The initial 0.1.0 delivery tested all five AWS Knowledge adapters, exact-ID skill retrieval, AWS Documentation 1.2.3 discovery and allowlisted search, and local STS/tagged inventory/one-day cost history. Those private account results were not published. Runtime IAM simulation denied five selected account actions; it was not an exhaustive permissions proof. These observations are historical, not a claim that every release repeats authenticated-account tests.

The service remains a community deployment without uptime SLA. A budget target and credits are not financial hard stops. Current boundaries and recovery procedures: [architecture](architecture.md), [costs](costs.md), [operations](operations.md), [privacy](../PRIVACY.md).
