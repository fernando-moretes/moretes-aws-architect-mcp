# Moretes Architect MCP 0.4.1

26 October 2026 · reliability and documentation patch.

## Fixed

- Large stable queues no longer produce NaN/null from Erlang C overflow. The implementation uses the Erlang B recurrence and a maximum of 100,000 concurrent slots. At 900 arrivals/s, one-second service and 1,000 consumers, wait probability is 0.0006 and mean in system is 900.005.
- GitHub Action report-only mode (`fail-on: ""`) still reports severity findings successfully, but invalid JSON, missing files, execution failures and failed artifacts now fail the step. Exit codes remain 0/1/2 for success/findings/error.
- Action arguments avoid shell expansion. JSON file arrays support paths with spaces; SARIF accepts one input only.

## Validation and maintenance

- 50 behavioral/contract tests, including high-precision queue references and real CLI Action regressions.
- Node 22/24 CI, CodeQL and workflow self-tests; clean consumer package installation exercises both CLI and stdio binaries.
- Documentation checks validate release manifests and local links. Generated schemas, tool contracts and examples remain reviewable.
- Production smoke checks the exact version, 48 tools, 20 prompts, 18 resources, queue regression, live AWS Knowledge and rejection of account tools.
- Consolidated PT/EN installation, handoff, release history, privacy, cost and operations documentation for the channels delivered in 0.4.0.

## Use

- Public MCP: https://mcp.moretes.com/mcp
- Landing: https://mcp.moretes.com/
- npm: https://www.npmjs.com/package/moretes-aws-architect-mcp
- GitHub: https://github.com/fernando-moretes/moretes-aws-architect-mcp

```sh
npx --yes --package moretes-aws-architect-mcp@0.4.1 moretes-architect list
claude mcp add --transport http moretes-architect https://mcp.moretes.com/mcp
```

The same 48 public tools and 10 architect personas remain available. Reviews are heuristic triage. Public quotas are 300 requests/day per source-IP origin and 3,000 globally; local deterministic tools have no hosted quota. No remote account OAuth, model calls or public account access. The catalog does not imply every provider is tested. See [deployment evidence](deployment.md) and [operations](operations.md).

Compatibility: queue products above 100,000 concurrent slots are now rejected explicitly to bound compute. Pipelines that previously hid malformed inputs in report-only mode now fail and need their inputs repaired. No public tool was removed or renamed.
