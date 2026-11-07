# Deployment and validation — 0.5.0

Verified 7 November 2026. Source fixes are merged in [PR #20](https://github.com/fernando-moretes/moretes-aws-architect-mcp/pull/20) and [PR #21](https://github.com/fernando-moretes/moretes-aws-architect-mcp/pull/21); release [PR #22](https://github.com/fernando-moretes/moretes-aws-architect-mcp/pull/22) was tagged at `1965e0d673f821cd02ad287d3095eca55c6fb04f`. All passed Node 22/24 CI, Action self-test and CodeQL.

The [v0.5.0 release](https://github.com/fernando-moretes/moretes-aws-architect-mcp/releases/tag/v0.5.0) records actual distribution and deployment outcomes. This checklist alone does not claim those operations completed.

### Confirmed 0.5.0 evidence

- [Publish](https://github.com/fernando-moretes/moretes-aws-architect-mcp/actions/runs/42392695896) completed npm with provenance, MCP Registry and CycloneDX SBOM. The SBOM is attached to the GitHub release. A clean consumer install of the published npm package passed CLI/stdio discovery, manifest parity, queue regression and account isolation.
- [Container](https://github.com/fernando-moretes/moretes-aws-architect-mcp/actions/runs/42392695912) completed linux/amd64 and linux/arm64 with provenance. OCI index: `sha256:58fd063cf658cc298800a4b05e2f30844c8e65f917a6860bc09e9145ada86c32`.
- [Release CI](https://github.com/fernando-moretes/moretes-aws-architect-mcp/actions/runs/42392695918), [CodeQL](https://github.com/fernando-moretes/moretes-aws-architect-mcp/actions/runs/42392692384) and [Action self-test](https://github.com/fernando-moretes/moretes-aws-architect-mcp/actions/runs/42392692362) succeeded. Local release gates included 60 tests and runtime audit with zero known vulnerabilities at execution time.
- The reviewed CloudFormation change set reached `UPDATE_COMPLETE`. Only `Function.Code` and the dependent `Integration.IntegrationUri` changed, with no replacement. All non-code parameters, including domain, certificate, quotas and budget, were preserved. Deployed Lambda code checksum matched the uploaded artifact; no IAM permissions or capacity were expanded.
- Live SDK smoke confirmed 0.5.0, 48 public tools, 20 prompts and 18 resources. Manifest/source parity, conditional ETag, partial capacity, structured input errors, capacity/large-queue regressions, official AWS Knowledge and public account rejection passed.
- Health, inventory, aggregate stats, well-known server card/Glama metadata and landing returned HTTP 200. Public manifest: https://mcp.moretes.com/manifest.json . Contract digest: `06f265c1244ad8edc2160ddac3787ba2a304889f529057a5b6a461b18d56d7c2`.

Billing, identity, stack parameters and private operational evidence remain outside public Git. Hashes and successful smoke checks do not certify security or every IDE/provider combination.

### Reproduce the release gates

- Run all 60 tests, typecheck/build, contracts, docs checks, clean consumer package install and runtime audit.
- Tag the merged release commit; verify Publish (npm, MCP Registry, SBOM) and Container (amd64/arm64 and provenance) separately.
- Verify the published npm package with `npm run package:smoke -- --package moretes-aws-architect-mcp@0.5.0`.
- Verify AWS identity and credit coverage privately. Preserve the deployed domain/certificate, quota, budget and existing stack parameters. Review the exact CloudFormation change set before execution.
- Wait for UPDATE_COMPLETE and run `npm run smoke -- https://mcp.moretes.com/mcp`. In addition to previous checks, verify full manifest/source parity, ETag, partial capacity and structured validation.
- Check health, tools, stats and well-known metadata. Do not infer users, successes or security certification from these signals.

Distribution targets: npm `moretes-aws-architect-mcp@0.5.0`, MCP Registry `io.github.fernando-moretes/moretes-aws-architect-mcp`, GHCR `ghcr.io/fernando-moretes/moretes-aws-architect-mcp:0.5.0`. Canonical endpoint: https://mcp.moretes.com/mcp .

## Historical evidence — 0.4.1


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
