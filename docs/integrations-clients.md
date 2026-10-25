# Integrations

Ways to use the workbench besides connecting an MCP client to the public endpoint. All of them run the same 48 tools.

| Integration | Where | What you get |
|---|---|---|
| Claude Code plugin | `.claude-plugin/` | `/plugin marketplace add fernando-moretes/moretes-aws-architect-mcp` then `/plugin install moretes-architect@moretes`: the remote MCP server plus the `moretes-architect` skill |
| Agent Skill | `skills/moretes-architect/SKILL.md` | Rules and flows the agent follows when it uses the tools; works in any client that loads Agent Skills (`npx skills add fernando-moretes/moretes-aws-architect-mcp`) |
| Gemini CLI extension | `gemini-extension.json` | `gemini extensions install https://github.com/fernando-moretes/moretes-aws-architect-mcp` |
| GitHub Action | `action.yml` | Review files in a workflow, Markdown in the job summary, optional SARIF, fail on a severity |
| pre-commit hooks | `.pre-commit-hooks.yaml` | Block commits with risky MCP configs, dependency manifests, CloudFormation, OpenAPI or source (needs Docker) |
| Container image | `Dockerfile`, `ghcr.io/fernando-moretes/moretes-aws-architect-mcp` | stdio MCP, local HTTP or the CLI, without Node on the host |
| CLI | `dist/cli.js` | `list`, `describe`, `call`, `check` with JSON, Markdown or SARIF and exit codes |

## GitHub Action

```yaml
- uses: actions/checkout@v4
- run: terraform show -json tfplan > plan.json
- uses: fernando-moretes/moretes-aws-architect-mcp@v0.4.0
  with:
    tool: terraform_plan_review
    files: plan.json
    fail-on: high          # empty: report only
    sarif: review.sarif    # optional, single file
- uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: review.sarif
```

Inputs: `tool`, `files` (space separated, one review per file), `fail-on` (`high`, `medium`, `info` or empty), `sarif`. Tested on every PR by `.github/workflows/action-selftest.yml`.

## pre-commit

```yaml
repos:
  - repo: https://github.com/fernando-moretes/moretes-aws-architect-mcp
    rev: v0.4.0
    hooks:
      - id: mcp-config-review
      - id: dependency-manifest-review
      # - id: cloudformation-review
      # - id: openapi-review
      # - id: code-review-architecture
```

Hooks run the container image, offline. `mcp-config-review` is the one most teams want first: it stops a commit that puts a token inside `.mcp.json` or auto-approves every tool.

## Container

```sh
# MCP over stdio (Claude Desktop, any stdio client)
docker run -i --rm ghcr.io/fernando-moretes/moretes-aws-architect-mcp

# CLI
docker run --rm -v "$PWD:/work" -w /work ghcr.io/fernando-moretes/moretes-aws-architect-mcp cli check terraform_plan_review plan.json

# Local HTTP on port 8787
docker run --rm -p 8787:8787 ghcr.io/fernando-moretes/moretes-aws-architect-mcp http
```

Client config for stdio through Docker:

```json
{ "mcpServers": { "moretes-architect": { "command": "docker", "args": ["run", "-i", "--rm", "ghcr.io/fernando-moretes/moretes-aws-architect-mcp"] } } }
```

The image runs as the unprivileged `node` user, carries the public tools only and has no AWS credentials. Account tools stay opt-in through environment variables, exactly as in local stdio. Images are multi-architecture (amd64, arm64) with build provenance attestation.

## Claude Code plugin and Agent Skill

```text
/plugin marketplace add fernando-moretes/moretes-aws-architect-mcp
/plugin install moretes-architect@moretes
```

The plugin connects the public endpoint and installs the skill. The skill tells the agent to ask before assuming, convene the right architect personas, take numbers from tools, check AWS facts in the official documentation and treat reviews as triage.
