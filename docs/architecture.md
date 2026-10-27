# Architecture and decisions

## ADR-001: public design plane, local account plane

Accepted for v0.1.0. A public architecture service needs official knowledge and calculation tools, not the maintainer's AWS permissions. Public HTTP always constructs `createServer(false)`, even if an account-tool environment variable is accidentally enabled. Its IAM role has only scoped log/quota access. Local stdio is opt-in and verifies the configured account before every resource operation.

Tradeoff: consumers run authenticated AWS integrations locally. Remote multi-tenant OAuth/IAM delegation requires separate design, review and tests and is not implemented.

## ADR-002: model-independent tools

The caller's LLM performs reasoning and language generation. Tools provide deterministic calculations, structured review prompts and live external evidence. This avoids an additional paid-model dependency and lets each user choose their IDE/model. Curated templates are heuristics, not an autonomous architect. Prices must be explicit, dated inputs. Unknown evidence stays unknown.

## ADR-003: stateless Streamable HTTP on Lambda

The official TypeScript SDK owns protocol handling. Each request creates and closes its own server/transport. JSON responses avoid holding SSE streams across Lambda invocations. Notifications receive the SDK's accepted response. Sessions, SSE GET streams, JSON-RPC batching, asynchronous tasks and resume tokens are intentionally unsupported. Standard SDK clients are tested against this transport.

API Gateway HTTP API fronts a Node 22 arm64 Lambda (256 MB, 25 seconds). Each accepted JSON MCP request consumes daily counters: 300 per caller and 3,000 globally. The caller key hashes day and source IP, truncated to 24 hex characters; raw IPs are not stored. The count is protocol requests, **not users or tool calls**. Quota-store failures fail closed. NAT/proxy callers share a quota; this is not authenticated identity or protection against distributed abuse. Authenticated quotas remain a roadmap item.

## ADR-004: bounded external knowledge

The public server has only two fixed outbound service destinations: AWS Knowledge for five named operations, and api.github.com for public repository metadata. No arbitrary server URL, shell command or credential forwarding. AWS document-reading inputs accept only explicit official HTTPS hosts; the upstream applies its own further URL rules. Requests have deadlines; oversized responses are rejected. Upstream text is data, never authority.

## ADR-005: catalog versus runtime federation

The catalog is generated from official AWS metadata, with source/retrieval timestamp and duplicate IDs removed. Package names are resolved from official pyproject files and pinned to published PyPI versions. Refresh is a maintenance action, not an automatic production upgrade. Review the resulting diff.

Local federation runs only a mapped official package from an already-populated offline uv cache. The exact tool names must appear in an owner-controlled allowlist. No tool can edit that allowlist. The subprocess gets a small environment rather than all ambient credentials. It can access HOME for AWS profiles, so the selected provider is trusted code with the user's local privileges. A package's official origin is not a sandbox or security guarantee. Run risky providers in an isolated development environment and use least-privilege IAM.

The dispatcher is annotated potentially destructive and non-idempotent. Provider-specific permissions, mutation approval and costs remain the user's responsibility. No write operation is demonstrated against production in this release.

## Data and failure behavior

- Inputs/results stay in process memory. No chat/history/vector store.
- CloudWatch receives request ID, duration and status; never request bodies, queries, AWS credentials or model transcripts.
- DynamoDB stores daily global/caller counters (2-day TTL) and monthly per-tool call counts (400-day TTL). `/stats.json` reads this stack's counters with a 10-minute cache. Tool names are counted before execution: totals include failed attempts and are not unique-user or successful-review metrics. TTL deletion is asynchronous.
- S3 stores the deployment bundle privately with encryption and TLS-only access.
- Public requests fail on quota/provider errors; no retry storm or silent fallback.
- Local tools do not reuse a prior successful identity check across resource operations.
- Static IAM/CloudFormation/Terraform/Kubernetes/code/API checks cover documented subsets, not full policy evaluation.
- Action report-only mode suppresses severity findings only; invalid input, execution and artifact errors fail.
- Queue calculations use a stable recurrence and reject more than 100,000 concurrent slots to bound CPU work.

## Sources checked

- [AWS MCP catalog](https://awslabs.github.io/mcp/)
- [AWS Knowledge](https://awslabs.github.io/mcp/servers/aws-knowledge-mcp-server)
- [Official TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x)
- [API Gateway Lambda payload v2](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html)
