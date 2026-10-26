# Client setup

Moretes Architect MCP speaks MCP over two transports:

- **Streamable HTTP (remote).** Public endpoint, no API key, shared daily quota. Exposes the 48 public tools, 20 prompts and 18 resources. It cannot touch any AWS account.
- **stdio (local).** `node dist/stdio.js` on your machine. Same 48 tools, no quota, and the only way to enable the 5 opt-in local tools (AWS account identity, tagged inventory, cost history, federation).

Canonical endpoint (verified 2026-10-24, version 0.2.0):

```text
https://mcp.moretes.com/mcp
```

Also available soon at `https://fernando.moretes.com/api/mcp` (a site rewrite to the same endpoint). Keep the execute-api URL as the canonical one in configurations. Landing page, `/health`, `/.well-known/mcp/server-card.json` and `/tools.json` live on the same host. Tutorials, course and FAQ: https://fernando.moretes.com/mcp.

Never put credentials in a URL or commit local credentials. Do not send confidential architecture, secrets or customer data to the public endpoint; use local stdio for private inputs.

In every snippet below, replace `<URL>` with the endpoint above.

## Remote (Streamable HTTP)

### Claude Code

```sh
claude mcp add --transport http moretes-architect <URL>
claude mcp list
```

Project scope writes a `.mcp.json` that teammates can share:

```sh
claude mcp add --transport http --scope project moretes-architect <URL>
```

```json
{
  "mcpServers": {
    "moretes-architect": {
      "type": "http",
      "url": "<URL>"
    }
  }
}
```

Use `/mcp` inside a session to inspect the server, its tools and prompts.

### Codex CLI

```sh
codex mcp add moretes-architect --url <URL>
codex mcp list
```

Equivalent entry in `~/.codex/config.toml`:

```toml
[mcp_servers.moretes-architect]
url = "<URL>"
```

### Kiro

`.kiro/settings/mcp.json` (workspace) or the user-level MCP settings:

```json
{
  "mcpServers": {
    "moretes-architect": {
      "url": "<URL>",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Keep `autoApprove` empty. Public tools are read-only, but approving per call keeps the habit for servers that are not.

### Cursor

`~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "moretes-architect": {
      "url": "<URL>"
    }
  }
}
```

### VS Code (GitHub Copilot)

`.vscode/mcp.json` in the workspace:

```json
{
  "servers": {
    "moretes-architect": {
      "type": "http",
      "url": "<URL>"
    }
  }
}
```

Or from a terminal:

```sh
code --add-mcp '{"name":"moretes-architect","type":"http","url":"<URL>"}'
```

### Gemini CLI

```sh
gemini mcp add --transport http moretes-architect <URL>
```

In `settings.json` the HTTP transport uses the `httpUrl` key.

### Amazon Q Developer CLI

In the Q Developer `mcp.json`:

```json
{
  "mcpServers": {
    "moretes-architect": {
      "type": "http",
      "url": "<URL>"
    }
  }
}
```

### Windsurf (Devin Desktop)

`~/.config/devin/mcp_config.json`:

```json
{
  "mcpServers": {
    "moretes-architect": {
      "serverUrl": "<URL>"
    }
  }
}
```

### Any other MCP client

The server is standard Streamable HTTP, stateless, JSON responses, one JSON-RPC operation per POST. If your client asks for a transport type, pick `http` or `streamable-http`. SSE-only clients are not supported: `GET /mcp` returns 405.

## Local (stdio)

There is no npm registry publication yet. Build from source:

```sh
git clone https://github.com/fernando-moretes/moretes-aws-architect-mcp.git
cd moretes-aws-architect-mcp
npm ci --ignore-scripts
npm run build
node dist/stdio.js      # MCP over stdio; protocol on stdout, no chat UI
node dist/cli.js list   # pipeline CLI, see pipelines.md
```

`npx -y github:fernando-moretes/moretes-aws-architect-mcp` may work because `package.json` has a `prepare` script that compiles TypeScript, but this path is untested. Prefer the clone.

Use the absolute path to `dist/stdio.js` in every client. Node.js 22.13 or newer is required.

### Claude Desktop

Claude Desktop connects to this project over local stdio only. In the desktop MCP configuration:

```json
{
  "mcpServers": {
    "moretes-architect": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/moretes-aws-architect-mcp/dist/stdio.js"]
    }
  }
}
```

Restart the app after editing.

### Claude Code (local)

```sh
claude mcp add moretes-architect-local -- node /ABSOLUTE/PATH/dist/stdio.js
```

### Codex CLI (local)

```sh
codex mcp add moretes-architect-local -- node /ABSOLUTE/PATH/dist/stdio.js
```

### Kiro, Cursor, VS Code (local)

Same JSON shape as remote, with `command` and `args` instead of `url`:

```json
{
  "mcpServers": {
    "moretes-architect-local": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/dist/stdio.js"]
    }
  }
}
```

VS Code uses `"servers"` as the top-level key and `"type": "stdio"`.

### Local HTTP for development

`npm run http` serves `http://127.0.0.1:8787/mcp` plus the landing page, bound to loopback only and with Host validation. It is a development convenience, not a deployment target.

## Local with AWS account tools (opt-in)

The three account tools (`aws_account_identity`, `aws_tagged_resources`, `aws_cost_history`) are never exposed over HTTP, even if the variables are set. They appear only in stdio with `ENABLE_AWS_ACCOUNT_TOOLS=true`.

Create or select a dedicated least-privilege profile. This repository does **not** create a role in your account. The calls used are `sts:GetCallerIdentity`, `tag:GetResources` and `ce:GetCostAndUsage`. Cost Explorer queries can incur charges. Do not use an administrator role as the normal client profile.

```json
{
  "mcpServers": {
    "moretes-architect-local": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/dist/stdio.js"],
      "env": {
        "ENABLE_AWS_ACCOUNT_TOOLS": "true",
        "AWS_PROFILE": "your-readonly-profile",
        "AWS_REGION": "us-east-1",
        "EXPECTED_AWS_ACCOUNT_ID": "YOUR_12_DIGIT_ACCOUNT"
      }
    }
  }
}
```

Rules enforced by the server before any resource call:

- `EXPECTED_AWS_ACCOUNT_ID` must be 12 digits and must match the STS identity. On mismatch no resource call is made.
- `AWS_REGION` must be `us-east-1` in this release.
- The SDK uses the standard credential chain (shared config, SSO where supported). No access key is ever typed into this project.
- Private results go to your local client. That client's model and privacy policy still apply to them.

### Federation with official AWS MCP servers (opt-in, local)

With `MORETES_INTEGRATIONS_FILE` pointing to a reviewed allowlist JSON, two more tools appear: `aws_integration_tools` and `aws_integration_call`. They start version-pinned official packages that are already in the `uv` cache (`uvx --offline`), after STS verification, and only expose tool names listed exactly in the file. Never auto-approve `aws_integration_call`; a provider can mutate resources and incur charges. Details in [integrations.md](integrations.md).

## Verify the connection

1. Health, from a shell:

   ```sh
   curl -s https://mcp.moretes.com/health
   ```

   Expected: `{"status":"ok","version":"0.2.0","publicTools":48,"accountTools":false}`.

2. In your client, open the MCP/tools panel. `tools/list` should show **48 tools**. Each has annotations: `readOnlyHint: true` on all public tools, `openWorldHint: true` only on the 6 tools that call outside (`aws_knowledge_search`, `aws_knowledge_read`, `aws_regions`, `aws_regional_availability`, `aws_skill`, `github_public_repository`).

3. Ask the model to call `capacity_plan` with `requestsPerSecond: 5`, `durationMs: 400`, `payloadKB: 4`, `headroom: 1.5`. The real output (from `docs/examples/capacity_plan.json`) is:

   ```json
   {
     "kind": "calculation",
     "averageConcurrency": 2,
     "plannedConcurrency": 3,
     "dailyRequests": 432000,
     "dailyPayloadGB": 1.728,
     "limitations": [
       "Assumes sustained rate all day; separate burst and average inputs",
       "Validate quotas, tail latency, downstream capacity, storage overhead and retries"
     ]
   }
   ```

   If the numbers match, the connection works and the tool ran. This call uses no network and no model.

4. Optional: ask for the resource `moretes://guide` or the prompt `architect_solution`. Both come back from the server without any tool call.

A protocol-level success does not mean every client feature was tested interactively in every IDE. Configurations follow the official documentation of each client as of 2026-10-24.

## Troubleshooting

| Symptom | Meaning | What to do |
|---|---|---|
| `429` with `Retry-After: 3600` | Quota reached: per-caller **300 requests/day** or global **3000 requests/day** (UTC). Every protocol request counts, including `initialize` and `tools/list`. | Wait, or switch to local stdio (no quota). Do not retry in a tight loop. |
| `429` without `Retry-After` | API Gateway throttle (5 requests/s, burst 20). | Back off a few seconds. |
| `405` on `GET /mcp` | Expected. The endpoint accepts POST only; `/` is the landing page. | Use an MCP client, or open `/` in the browser. |
| `403 Origin not allowed` | A browser `Origin` header was sent and no origin is approved. Native clients normally send none. | Use a native client. A private deployment may set `ALLOWED_ORIGINS`; there is no wildcard CORS. |
| `415 application/json required` | Request had another `Content-Type`. | Fix the client or proxy. |
| `413 Payload too large` | Body above 128 KiB. Tool arguments are also capped at 100 KB. | Split the document (for example one Terraform module at a time). |
| `503 Service paused` | The maintainer paused the service (`SERVICE_ENABLED=false`). | Use local stdio; check the repository for notices. |
| Tools absent or fewer than 48 | Client cached an old listing, or the URL is missing `/mcp`. | Reload the MCP connection, confirm the URL ends in `/mcp`, check `/tools.json`. |
| Account tools absent over HTTP | Intentional; they exist only in opted-in local stdio. | Use the local configuration above. |
| Upstream error from an `aws_knowledge_*` tool | AWS Knowledge MCP or the network failed. The tool returns `isError` instead of invented content. | Retry later; check connectivity. |

More cases in [troubleshooting.md](troubleshooting.md).
