# FAQ

Answers reflect version 0.4.1, updated on 2026-10-26. When a fact comes from code, the file is named so you can check it.

## Cost and availability

**Does it cost anything to use the public endpoint?**
No. There is no API key, no account and no charge to you. The maintainer pays the AWS bill (API Gateway, Lambda, DynamoDB); the design keeps it small and a USD 30/month gross-cost budget alerts him.

**Is there a quota?**
Yes, two fail-closed counters per UTC day (`src/lambda.ts`): 300 protocol requests per caller and 3,000 globally. A protocol request is every POST to `/mcp`: `initialize`, `tools/list`, each `tools/call`. When either counter is reached you get `429` with `Retry-After: 3600`. API Gateway also throttles at 5 requests per second, burst 20. The global counter is shared by everyone; one heavy user can exhaust it for the day. Local stdio has no quota.

**Is there an SLA?**
No. It is a community service run by one person on a single-region deployment (us-east-1). It can be paused (`503 Service paused`) or go away. `/health` reports version and tool count, not availability of upstream services. For anything that must keep working, run it locally.

**Why is the quota so low?**
Because the goal is design-time use by a person with an AI client, not batch processing. A review of a plan is a handful of calls. Pipelines should use the CLI (`docs/pipelines.md`), which runs locally and does not count.

## Privacy and data

**What leaves my machine when I use the public endpoint?**
Your tool arguments travel to the Lambda over TLS and are processed in memory. The Lambda keeps no copy; the only persistent state is the quota counters. Of the 48 tools, six call outside the Lambda: `aws_knowledge_search`, `aws_knowledge_read`, `aws_regions`, `aws_regional_availability` and `aws_skill` send your query, URL or region list to the official AWS Knowledge MCP (`knowledge-mcp.global.api.aws`); `github_public_repository` sends the owner and repository name to `api.github.com`. Nothing else is forwarded anywhere.

**What does the public endpoint log?**
One JSON line per request with `requestId`, HTTP `status` and `durationMs` (`src/lambda.ts`). No body, no tool name, no arguments, no IP. CloudWatch retention is 7 days. The per-caller quota key is `sha256(day | source IP)` truncated to 24 hex characters, stored with a 2-day TTL; the raw IP is never stored.

**Can I send confidential architecture or customer data?**
Do not send it to the public endpoint. Run locally over stdio for private inputs. Even locally, the model in your client and any external tool you call have their own data policies. The `aws_knowledge_*` tools transmit their explicit queries to AWS in both modes.

**Does the server see my AWS account?**
The public endpoint cannot. Its IAM role can write its own logs and update the quota table, nothing else. Account access exists only in local stdio with `ENABLE_AWS_ACCOUNT_TOOLS=true`, your own credentials, an explicit `EXPECTED_AWS_ACCOUNT_ID` and `AWS_REGION=us-east-1`, and even then only three read-only operations (`sts:GetCallerIdentity`, `tag:GetResources`, `ce:GetCostAndUsage`).

**Where is the privacy policy?**
`PRIVACY.md` at the repository root describes what the public service does with your data. `SECURITY.md` covers controls and the threat model.

## Design choices

**Why does the server not call a model?**
Three reasons. Cost: a model call per tool call would make a free public service impossible to sustain. Determinism: a calculator or a review that returns a different answer each run is not evidence. Separation of duties: your client already has a model; the server adds structure, arithmetic, snapshots and live official sources that the model lacks. The landing page states it: "Sem chamadas a modelos".

**Is this AWS-only?**
AWS-first, not AWS-only. `service_equivalents` maps 43 capability categories across AWS, Azure, Google Cloud, OCI and open source from a dated snapshot. `architecture_pattern` takes a `provider` parameter and maps its services. `terraform_plan_review` works on any provider's plan. `kubernetes_manifest_review`, `openapi_review`, `code_review_architecture`, `dependency_manifest_review`, the reliability calculators and the AI-safety tools are provider-neutral. The live documentation adapters are AWS-only because they wrap the official AWS Knowledge MCP.

**Are the reviews a certification?**
No. Every review tool returns `limitations` saying so. `terraform_plan_review` matches patterns on planned attribute values and cannot see values unknown until apply. `iam_policy_review` cannot evaluate effective permissions. `well_architected_review` is not the AWS Well-Architected Tool; it sorts your evidence and downgrades `met` without evidence to `unknown`. `mcp_server_review` reads descriptions and schemas, not code. A clean result is not an approval. Use IAM Access Analyzer, cfn-lint, Checkov, OPA, Kyverno, Spectral, Semgrep or CodeQL for enforcement.

**Why do cost tools refuse to guess prices?**
Because a price without a date and a source does not survive a finance review. `cost_model`, `storage_growth` and `finops_unit_economics` take your unit rates, with URL and date, and return a scenario labeled `scenario-not-quote` or `projection-not-quote`. The skill `moretes://skills/cost-scenario` explains how to source them.

**Is `data_classification` legal advice?**
No. It maps data elements to regulation hints (LGPD for Brazil, GDPR, PCI DSS, HIPAA) as pointers for a legal or privacy review. Article numbers may change; verify the current text with counsel.

**What are personas and why are there ten?**
A persona is a lens: mandate, questions, checks, deliverables, tools, anti-patterns (`src/personas.ts`). The model adopts it through the `architect_<id>` prompt, the `architect_panel` tool or the `moretes://personas/<id>` resource. The ten roles (solution, enterprise, business, data, infrastructure, software, AI, security, governance, FinOps) are how Fernando Azevedo splits architecture work; they are not a standard. See `docs/personas.md`.

**What is the difference between a prompt, a resource and a skill here?**
A prompt is a ready-made instruction the client inserts into the conversation (10 workflow prompts plus 10 persona prompts). A resource is read-only content the client can attach: `moretes://guide`, `moretes://boundaries`, `moretes://tools`, ten `moretes://personas/<id>` and five `moretes://skills/<id>`. A skill is a longer Markdown playbook stored as a resource (`src/data/skills.json`): architecture-review, adr-writing, agent-production-readiness, iac-change-review, cost-scenario. The skills are not Claude Code skills or AWS skills; the `aws_skill` tool fetches those from AWS.

## Local versus remote

**When should I run it locally?**
When your inputs are confidential, when you need the AWS account tools, when you want federation with official AWS MCP servers, when you hit the quota, or when you run it in CI. Local is the same code (`dist/stdio.js`) with the same 48 tools plus the opt-in ones.

**Why are the account tools local-only?**
Because a shared public server must never hold or be handed credentials for your account. The HTTP server is created with `createServer(false)` and never registers account or federation tools, regardless of environment variables (`src/server.ts`). Local stdio with your SDK credential chain is the only path, and it verifies STS identity against `EXPECTED_AWS_ACCOUNT_ID` before any call.

**Is there an npm package?**
Yes: [moretes-aws-architect-mcp](https://www.npmjs.com/package/moretes-aws-architect-mcp). Use `npx --yes --package moretes-aws-architect-mcp@0.4.1 moretes-architect list` for the CLI or replace the final command with `moretes-aws-architect-mcp` for stdio. Node 22.13+ is required. Installation requires registry access; deterministic reviews run offline once installed. Source builds remain supported.

**Which clients work?**
Any MCP client with Streamable HTTP for remote use (Claude Code, Codex CLI, Kiro, Cursor, VS Code with Copilot, Gemini CLI, Amazon Q Developer CLI, Windsurf/Devin Desktop) and any client with stdio for local use (also Claude Desktop). Snippets in `docs/clients.md`. Protocol-level tests passed; not every IDE was tested interactively.

**Does Claude Desktop work with the public URL?**
Use local stdio with Claude Desktop. The documented configuration runs `node /ABSOLUTE/PATH/dist/stdio.js`.

## Relation to other projects

**How does this relate to the official `awslabs/mcp` servers?**
It complements them. The official servers are operational: they read and change resources in your account (pricing, CDK, documentation, databases, and so on). This workbench is design-time: requirements, diagrams, ADRs, calculators, heuristic reviews, agent safety, with no account access on the public endpoint. `integration_catalog` indexes 61 official servers from a snapshot and `integration_config` writes version-pinned configurations for them; the optional local federation can call exactly allowlisted tools of an installed official package. The five `aws_knowledge_*` adapters wrap the official AWS Knowledge MCP.

**Is this an AWS product?**
No. It is an independent open-source project by Fernando Azevedo, an AWS Community Builder (AI Engineering) in Brazil. It is not an official Well-Architected review, a security certification or a guarantee of pricing. AWS and other product names belong to their owners.

**Why `moretes`?**
It is the author's family name and the name of his site and projects (`fernando.moretes.com`). All his AWS resources carry the `moretes-` prefix.

## Using it well

**What is a good first prompt?**
"Use the moretes-architect tools. I need an API to process orders. Ask me first about traffic, data, SLO and budget. Compare Lambda and ECS, search the AWS documentation, draw the diagram and write an ADR with assumptions and pending tests." The server's own `moretes://guide` resource describes the intended flow: discover requirements, convene the panel, compare options, verify sources, model capacity, latency, cost and risk, review IaC and code, record the decision, test failure recovery, obtain deployment authorization.

**The model keeps guessing inputs instead of asking. What do I do?**
Load a persona prompt (`architect_solution`) or call `architect_panel`; both tell the model to ask first. `requirements_check` returns `decisionsToClarify` for exactly this purpose. The server `instructions` also say "Ask before assuming requirements."

**Why does the tool output say `kind: "heuristic-design-aid"`?**
Every result labels itself: `calculation`, `heuristic-design-aid`, `decision-table`, `reference-snapshot`, `scenario-not-quote`, `projection-not-quote`, `document`, `*-heuristic-review`. The label tells the model (and you) how much weight the output deserves.

**Can I use the tools without an AI client?**
Yes, with the CLI: `node dist/cli.js call <tool> --input args.json`. `list` and `describe <tool>` show what exists and the schema. See `docs/pipelines.md`.

## Contributing

**How do I add a tool?**
Read `CONTRIBUTING.md`. In short: a strict Zod schema with bounded text and arrays, a clear description that states the boundary (what it does not do), `external: true` if it calls outside, provenance and a `limitations` list in the output, tests for useful behavior and failure cases, no live AWS calls in default tests, then `npm run typecheck`, `npm test`, `npm run build`, `npm run docs:tools` to regenerate `docs/tools.md`, and a changelog entry. Open a tool proposal issue first using the template; it asks for the problem, inputs, expected output, limitations and whether the tool calls outside.

**How do I report a bug?**
Open an issue with the bug report template: steps, client and version, expected and actual result, sanitized inputs. Never include secrets, account IDs or customer data. Security vulnerabilities go privately to fernando@moretes.com (`SECURITY.md`); no response-time SLA is promised.

**Where are tutorials and the course?**
https://fernando.moretes.com/mcp (videos, course, FAQ in Portuguese and English).
