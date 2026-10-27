# Deployment and validation

Release **0.4.1**, 26 October 2026 (America/Sao_Paulo). The GitHub release and tag workflows record the immutable build/publishing results; this file describes the validation gates and the historical evidence separately.

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
