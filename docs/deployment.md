# Deployment and validation

Release: **0.1.0**, 24 October 2026 (America/Sao_Paulo).

- Landing page: https://m9od37vm41.execute-api.us-east-1.amazonaws.com/
- MCP endpoint: https://m9od37vm41.execute-api.us-east-1.amazonaws.com/mcp
- Health: https://m9od37vm41.execute-api.us-east-1.amazonaws.com/health
- Region: us-east-1.
- Application stack: `moretes-architect-mcp`; artifacts stack: `moretes-architect-mcp-artifacts`.

CloudFormation reported CREATE_COMPLETE. Production SDK smoke verified initialization, discovery of 24 public tools, a capacity calculation, a live AWS Knowledge query, rejection of account tools, three resources and four prompts. The daily counter persisted eight protocol requests during the initial smoke. The USD 30 gross-cost budget and active Project cost-allocation tag were read back after deployment.

## Evidence and scope

| Check | Result |
|---|---|
| TypeScript strict check | Passed |
| MCP SDK client over in-memory transport | Passed |
| MCP SDK client over stateless HTTP | Passed |
| Input bounds, negative numbers, invalid diagram edges | Passed |
| Evidence-free met control downgraded to unknown | Passed |
| IAM/CloudFormation heuristic cases | Passed |
| Origin, body limit, batch and daily-quota rejection | Passed |
| Public account-tool isolation | Passed |
| Production AWS Knowledge search | Passed |
| Live AWS Knowledge read, regions, regional availability and exact-ID skill retrieval | Passed |
| Optional local AWS Documentation 1.2.3 discovery | Passed |
| Optional local allowlisted documentation search | Passed |
| Local STS identity, tagged Lambda inventory and one-day cost history | Passed; private results were not published |
| Runtime IAM simulation for S3 account listing, role assumption, Bedrock invocation, IAM user creation and Lambda invocation | All five denied |
| Runtime dependency audit | No known vulnerabilities reported at validation time |

The initial GitHub CI run passed on Node 22 and Node 24. The test suite contains 15 behavioral/negative tests. The verified local provider allowlist exposed only `read_documentation` and `search_documentation`; a real documentation search succeeded through the bridge.

This is not a claim of full interactive testing inside every IDE. Client configuration examples follow official documentation. Other catalog packages have pinned configurations, but were not all installed or functionally tested. No AWS resource mutation was performed through a provider. The tagged-resource inventory test is not a claim of complete account discovery, and the IAM simulation covers only the listed actions.

The public service is an initial community release with shared quotas and no uptime SLA. Full source, validation commands, operational limits and recovery procedures are in this repository. CI results are available in the Actions tab after publication.
