# Client setup

Use the endpoint from [deployment.md](deployment.md). Never put credentials in a URL or commit local credentials.

## Codex

```sh
codex mcp add moretes-architect --url <MCP_URL>
codex mcp list
```

Equivalent configuration:

```toml
[mcp_servers.moretes-architect]
url = "<MCP_URL>"
```

Local mode: `codex mcp add moretes-architect-local -- node /ABSOLUTE/PATH/dist/stdio.js`.

Source: [official OpenAI MCP setup](https://developers.openai.com/learn/docs-mcp). Syntax was also checked against the installed `codex mcp add --help`. A successful protocol smoke test does not claim a full interactive test in every IDE.

## Claude Code

```sh
claude mcp add --transport http moretes-architect <MCP_URL>
claude mcp list
```

Use `/mcp` in a Claude Code session to inspect available tools. [Official documentation](https://code.claude.com/docs/en/mcp).

## Claude Desktop (local)

In the desktop MCP configuration, use an absolute path to the compiled entrypoint:

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

Restart/reload MCP after editing. Remote connector availability depends on the client account/version; use local stdio where remote connections are unavailable.

## Kiro

```json
{
  "mcpServers": {
    "moretes-architect": {
      "url": "<MCP_URL>",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

[Official configuration documentation](https://kiro.dev/docs/mcp/configuration/). Keep operation approval for account/provider tools; do not auto-approve the federation dispatcher.

## Authenticated local AWS access

Create/select a dedicated least-privilege profile. This repository does **not** create a role in your account for consumers. For the three built-in tools, the relevant calls are `sts:GetCallerIdentity`, `tag:GetResources` and `ce:GetCostAndUsage`. Cost Explorer queries can incur charges. Do not use an administrator role as the normal client profile.

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

The SDK uses the standard credential chain (including shared config/SSO where supported); no access key is entered into this public service. Each operation verifies STS identity first. Region is intentionally restricted to us-east-1 in this release. Private AWS results are returned to your local MCP client; that client's model/privacy policy still applies.

## Troubleshooting

- `429`: shared daily quota or API Gateway throttle. Use backoff/local mode; do not retry in a tight loop.
- `405` for browser GET `/mcp`: expected. The MCP endpoint accepts POST, while `/` is the landing page.
- `403 Origin`: browser-origin requests are denied by default. Native clients normally send no Origin. A private deployment may explicitly set allowed origins; there is no wildcard CORS.
- Tools absent: reload client, confirm `/mcp`, and inspect `tools/list` with the smoke test.
- Account tools absent: they are intentionally unavailable on HTTP; use the opted-in local configuration.
- Upstream failure: check network/rate limits; source failures are not replaced with invented content.
