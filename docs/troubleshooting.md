# Troubleshooting

Symptom, what to check, how to fix. Version 0.4.1. HTTP status codes come from `src/web.ts` and `src/lambda.ts`; local errors from `src/account.ts`, `src/federation.ts` and `src/cli.ts`.

## Public endpoint (HTTP)

| Symptom | Check | Fix |
|---|---|---|
| `429` with body `Daily service limit reached; use local stdio mode.` and `Retry-After: 3600` | A quota counter is full: per caller 300 requests per UTC day, or global 3,000. Every POST to `/mcp` counts (`initialize`, `tools/list`, `tools/call`). Also returned when the counter table itself is unavailable (fail-closed). | Wait for the UTC day to roll over, or run locally over stdio (no quota). Do not retry in a loop; clients that re-`initialize` on every call burn the quota fast. |
| `429` without `Retry-After`, sometimes with an API Gateway message | API Gateway throttle: 5 requests/s, burst 20. | Space calls a few seconds apart. |
| `403` with body `Origin not allowed` | The request carried a browser `Origin` header and `ALLOWED_ORIGINS` does not list it (default: none). Native clients send no `Origin`. | Use a native MCP client. A private deployment can set `ALLOWED_ORIGINS` explicitly; there is no wildcard CORS. |
| `404 Not found` | Path is not `/`, `/health`, `/tools.json`, `/.well-known/mcp/server-card.json`, `/.well-known/glama.json` or `/mcp`. | Check the URL ends in `/mcp`, with no trailing slash and no `/sse`. |
| `405` on `GET /mcp`, body mentions "standalone SSE is not supported" | Expected. The endpoint is Streamable HTTP with POST only; no SSE stream. | Open `/` in a browser instead. If the client insists on SSE, it is not compatible with this server. |
| `413 Payload too large` | Body above 128 KiB, or `Tool arguments exceed 100 KB` inside a tool result. | Split the input: one Terraform module, one CloudFormation stack, fewer manifests, a shorter code file (`code_review_architecture` also caps at 3,000 lines). |
| `415 application/json required` | `Content-Type` was not `application/json`. | Fix the client or any proxy that rewrites headers. |
| `400 Invalid JSON` | Body did not parse. | Check the proxy; some add a BOM or truncate. |
| `400 Batch requests are disabled` | A JSON-RPC array was sent. | One operation per request. The MCP SDK clients do this by default. |
| `503 Service paused` | The maintainer set `SERVICE_ENABLED=false`. `/` and `/health` still answer. | Use local stdio. Check the repository for a notice. |
| `500 Service error` | Unhandled failure in the Lambda. | Retry once. If it persists, open a bug with the `requestId` if your client shows it and the time in UTC. |
| Tool call returns `isError: true` with `upstreamError: true` | One of the six external tools (`aws_knowledge_*`, `aws_regions`, `aws_regional_availability`, `aws_skill`, `github_public_repository`) failed upstream or timed out (18 s for Knowledge, 8 s for GitHub). | Retry later. The server does not substitute invented content for a failed source. |
| Tool call returns `Invalid tool input: ...` | Zod rejected the arguments: wrong type, enum, bounds or an unknown field (schemas are strict). | Read the path in the message; compare with `describe <tool>` in the CLI or the schema in `docs/tools.md`. |
| `Unknown or unavailable tool` | The name does not exist on this transport. Account and federation tools are never on HTTP. | Check `tools/list` or `/tools.json`. |

## Client issues

| Symptom | Check | Fix |
|---|---|---|
| Fewer than 48 tools, or none | Client cached an older listing, or the server entry points to `/` instead of `/mcp`. | Reload the MCP connection (in Claude Code: `/mcp`, then reconnect; in VS Code: restart the server from the MCP view; in Kiro: toggle `disabled`). Confirm `/tools.json` shows 48 and `/health` shows `"publicTools":48`. |
| Tools still old after updating a local build | Client keeps the first `tools/list` for the session. | Rebuild (`npm run build`) and restart the client or the server entry. Changing `src/` without `npm run build` changes nothing in `dist/`. |
| Prompts or resources do not appear | Some clients show only tools. | Read `moretes://guide` through a client that supports resources, or copy the prompt text from `src/server.ts`. The server advertises `tools`, `resources` and `prompts` capabilities. |
| The model guesses inputs instead of asking | No persona or workflow prompt was loaded. | Load `architect_<role>` or call `architect_panel`; call `requirements_check` and read `decisionsToClarify`. |
| Model treats a review as approval | It ignored `limitations`. | Ask it to quote the `limitations` array and the `gate` field; remind it that heuristic results are triage. |
| Browser extension or web client gets `403` | It sends an `Origin` header. | Not supported on the public endpoint by design. |

## Local stdio

| Symptom | Check | Fix |
|---|---|---|
| `node dist/stdio.js` prints nothing | Expected. stdout carries MCP protocol frames only; there is no chat UI and no banner. | Connect an MCP client to it, or run `npm run http` and open `http://127.0.0.1:8787/`. For diagnostics, use stderr; never print to stdout from a tool. |
| Client says the server exited or produced invalid JSON | Something wrote to stdout. Common causes: a `console.log` added to `src/`, a Node warning, or `npm start` in a shell that echoes. | Keep stdout clean; write logs to stderr. Run `node dist/stdio.js` directly with an absolute path instead of through `npm`. |
| `dist/stdio.js` not found | The project was not built. | `npm ci --ignore-scripts && npm run build`. |
| Node version error | `engines.node` is `>=22.13`. | Install Node 22.13 or newer (Node 24 is tested in CI). |
| Account tools missing in the client | Any of: not stdio, `ENABLE_AWS_ACCOUNT_TOOLS` not `true`, client not restarted. | Set the env in the client's server entry (not only in your shell), restart the client. |
| `Account tools are available only in explicitly enabled local stdio mode` | Called over HTTP, or the env is missing. | Same as above. The HTTP server never exposes them. |
| `Set EXPECTED_AWS_ACCOUNT_ID before accessing AWS` | The guard needs the 12-digit account. | Add `EXPECTED_AWS_ACCOUNT_ID` to the server entry's `env`. |
| `This release requires AWS_REGION=us-east-1` | Region guard. | Set `AWS_REGION=us-east-1` in the entry. Other regions are not supported in this release. |
| `AWS account mismatch; no resource call made` | STS identity differs from `EXPECTED_AWS_ACCOUNT_ID`. The profile points at another account. | Fix `AWS_PROFILE`. Do not change the expected account to match an unknown identity. |
| `AWS operation failed or guard rejected the request; verify configuration, account identity and permissions.` | Generic message: raw SDK errors are never returned. Usually expired SSO session, missing `tag:GetResources` or `ce:GetCostAndUsage` permission, or Cost Explorer not enabled. | Run `aws sts get-caller-identity` with the same profile; log in again (`aws sso login`); check the policy. |
| `Use an exclusive end date and a window of 1–31 days` | `aws_cost_history` dates. | `end` is exclusive; keep the window between 1 and 31 days. |

## Local federation (official AWS MCP packages)

| Symptom | Check | Fix |
|---|---|---|
| `aws_integration_tools` and `aws_integration_call` missing | Needs both `ENABLE_AWS_ACCOUNT_TOOLS=true` and `MORETES_INTEGRATIONS_FILE` (absolute path). | Set both in the server entry and restart. |
| `Set MORETES_INTEGRATIONS_FILE to a reviewed local allowlist` | Variable missing or empty. | Point it at a reviewed JSON like `examples/integrations.json`. |
| `Integration not approved or package unavailable` | The `id` is not in your allowlist or has no pinned package in `src/data/packages.json`. | Use an `id` from `integration_catalog`; add it to `servers[]` in the allowlist. |
| `Tool is not on the exact allowlist` | Tool name not listed under `allowTools` for that server. Wildcards are not supported. | Add the exact name. Prefer read-only tools. |
| Provider does not start, times out, or `Allowlisted tool not exposed by installed provider` | The bridge runs `uvx --offline <package>@<version>`: the pinned version must already be in the `uv` cache. Discovery has 15 s, calls 18 s, overall 25 s. | Cache it once, explicitly: `uvx awslabs.<server>@<version> --help` (this downloads and runs third-party code; review first). Confirm `uv` is on the `PATH` the client passes to the server. Check the provider's own prerequisites (Python >= 3.10 and any extra env). |
| `Allowlist too large` | File over 32,000 characters, or more than 20 servers / 80 tool names per server. | Trim the allowlist. |
| `Provider output too large; narrow the request` | Result above 180,000 serialized characters. | Ask the provider tool for less (filters, pagination). |
| A write through `aws_integration_call` returned an unknown outcome | The bridge does not guarantee exactly-once. | Verify the real state at the target before any retry. Never auto-approve the dispatcher. |

## CLI

| Symptom | Check | Fix |
|---|---|---|
| Exit code `2`, `error: input is not valid JSON` | `--input` file is YAML, has a BOM, or is empty. | Convert with `yq -o=json '.' file.yaml > file.json`. For Kubernetes, produce an array: `yq -o=json -I=0 '.' \| jq -s '.'`. |
| Exit code `2`, `error: Invalid input: plan: ...` or another schema path | The file is neither the raw document nor the arguments object the tool expects. | Run `node dist/cli.js describe <tool>` and shape the file accordingly. For `dependency_manifest_review` build `{filename, content, lockfilePresent}` with `jq --rawfile`. |
| Exit code `2`, `unknown tool` | Typo, or an account tool (not available in the CLI). | `node dist/cli.js list`. |
| Exit code `2`, `--fail-on high\|medium\|info` | Invalid severity. | Use one of the three. |
| `--arg content=...` fails schema validation | Values starting with `{` or `[` are parsed as JSON. | Pass the content through an arguments file instead. |
| Exit code `1` but you expected `0` | A finding at or above `--fail-on` exists. | Read the Markdown or JSON output; triage the finding; lower `--fail-on` only with a reason. |
| `--format sarif` has results without locations | `--input -` (stdin) was used, so there is no file path to point at. | Pass a file path to `--input`. |
| Calculator output with `--format markdown` is a JSON block | Calculators have no `findings` or numeric `summary`; the CLI prints the whole result. | Use `--format json` and `jq` for scripts. |

## SARIF upload (GitHub code scanning)

| Symptom | Check | Fix |
|---|---|---|
| `Resource not accessible by integration` | Job lacks `security-events: write` (and `actions: read` on private repositories). | Add the `permissions` block to the job. |
| Upload step skipped because the review step failed | `--fail-on` returned `1` and stopped the job. | Put `continue-on-error: true` and an `id` on the review step, upload with `if: always()`, then fail in a final step on `steps.<id>.outcome == 'failure'`. |
| Empty or invalid SARIF file | The CLI exited `2` before writing (bad input), so the redirect created an empty file. | Check the review step log; fix the input; the SARIF is written only on exit `0` or `1`. |
| Alerts not shown although results exist | Results without `physicalLocation` (stdin input), or the path does not exist in the repository. | Use a file path with `--input`. For generated files such as `plan.json`, the alert attaches to that path; read the resource address in the message. |
| Too many alerts, all `note` | `info` findings map to `note`. | Filter with `jq` before upload, or raise the pipeline's `--fail-on` and keep `info` in the Markdown summary only. |
| Code scanning rejects the category or driver | `category` must be stable per workflow; driver name is `moretes-architect`. | Keep one `category` per tool (for example `moretes-architect/terraform`). |

## Still stuck

Open a bug report with the symptom, the exact message, client and version, the `requestId` if shown, and sanitized inputs. Never include secrets, account IDs or customer data. Security issues go privately to fernando@moretes.com.
