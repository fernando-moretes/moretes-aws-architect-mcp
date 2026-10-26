# Privacy

What the public service does with your data, in one page. The local mode (stdio and CLI) sends nothing anywhere unless you call the two tool families listed below.

## Public endpoint (`https://mcp.moretes.com/mcp`)

**Collected per request, kept 7 days in CloudWatch Logs:**

```json
{"requestId":"6b0c2e1a-...","status":200,"durationMs":41}
```

That is the whole log line. Tool name, arguments, results, prompts, headers and bodies are never logged.

**Quota counters, kept 2 days in DynamoDB:**

- `global#2026-10-24` → number of MCP requests that day.
- `client#<24 hex chars>#2026-10-24` → number of requests from one caller. The key is `sha256(day + source IP)`, truncated. The raw IP is not stored and the key changes every day.

**Usage counters, kept 400 days in DynamoDB:**

- `toolmonth#capacity_plan#2026-10` → how many times that tool was called that month.

Only the tool name and the month. No arguments, results, caller key or IP. The totals are public at `/stats.json` so anyone can see which tools are used.

**What leaves the server:**

| Tool | Destination | What is sent |
|---|---|---|
| `aws_knowledge_search`, `aws_knowledge_read`, `aws_regions`, `aws_regional_availability`, `aws_skill` | `https://knowledge-mcp.global.api.aws` (official AWS Knowledge MCP) | The query, document URL, region names or skill id you pass |
| `github_public_repository` | `https://api.github.com` | The public owner/repo name |
| Every other tool | nowhere | Computed in memory |

**Not collected:** accounts, emails, cookies, analytics, fingerprints. Browser origins are rejected by default, so no web page can call the endpoint on your behalf.

**Retention:** logs 7 days, quota counters 2 days, per-tool monthly counters 400 days, nothing else persisted.

## Local mode

`node dist/stdio.js` and `node dist/cli.js` run on your machine. The optional account tools use your own AWS SDK credential chain and call `sts:GetCallerIdentity`, `tag:GetResources` and `ce:GetCostAndUsage`; results go to your MCP client only. The federation bridge starts an official awslabs package you installed, with a minimal environment (profile, region, PATH, HOME) and drains its stderr without storing it.

## Your client still matters

The model in your client (Claude, Codex, Kiro, Cursor, Copilot...) sees every tool result. Its privacy policy applies to that content. Do not paste secrets or customer data into a public endpoint; use local mode for private inputs.

## Opt-out and questions

There is nothing to opt out of beyond not calling the two external tool families. Questions: fernando@moretes.com. Security reports: see [SECURITY.md](SECURITY.md).
