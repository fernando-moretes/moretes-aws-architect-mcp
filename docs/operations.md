# Operations runbook

## Deploy safely

Maintainer deployment scripts are deliberately pinned to `AWS_PROFILE=fernando-moretes`, `us-east-1`, and require `EXPECTED_AWS_ACCOUNT_ID` to match STS. Set that variable to the privately verified owner account before running. Consumers should use their own reviewed fork/deployment configuration. No Terraform apply is used and no existing portfolio resources are adopted or changed.

```sh
AWS_PROFILE=fernando-moretes AWS_REGION=us-east-1 aws sts get-caller-identity
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
# Read and preserve the existing domain and certificate before an update.
python3 scripts/deploy.py --email YOUR_ALERT_EMAIL \
  --domain mcp.moretes.com --certificate-arn YOUR_EXISTING_CERTIFICATE_ARN
```

The default creates/updates the private artifact stack, uploads a content-addressed bundle and **prepares** the service change set. Inspect the printed change-set ARN with `aws cloudformation describe-change-set`, including IAM scope and replacements. Execute that exact reviewed change set with `execute-change-set`, then wait for stack completion. `--execute` is for already-reviewed automated reruns; it does not replace review.

The domain flags currently default to empty strings: omitting them on an existing custom-domain stack clears those parameters. Query `Stacks[0].Parameters` with `describe-stacks`, pass the existing values explicitly, and reject any unexpected domain removal or quota/budget change. Do not copy private certificate/account parameters into public documentation. For the initial deployment without a custom domain, empty flags are intentional.

```sh
AWS_PROFILE=fernando-moretes AWS_REGION=us-east-1 aws cloudformation describe-stacks \
  --stack-name moretes-architect-mcp --query 'Stacks[0].Outputs'
npm run smoke -- https://mcp.moretes.com/mcp
```

Check that `Project` is an active cost-allocation tag. Do not write deployment output containing account or notification details into public documentation. Public endpoint URLs may be published.

## Health and incidents

`GET /health` reports version and public tool count; it is a process/configuration check, not an upstream dependency check. `npm run smoke` additionally calls official AWS Knowledge, validates a calculation and tests public account-tool rejection.

For 5xx: inspect the scoped Lambda log group `/aws/lambda/moretes-aws-architect-mcp`, error/duration metrics and current package version. Logs contain only request ID, duration and HTTP status. Do not turn on raw body logging to troubleshoot customer input. For 429: distinguish API throttling from daily quota; the latter response mentions the daily service limit.

Do not retry writes through local federation after uncertain outcomes. Verify the provider's target state and use its recovery process. This workbench has no exactly-once execution guarantee.

## Immediate pause

To stop Lambda execution during abuse/cost investigation, set **only this function's** reserved concurrency to zero:

```sh
AWS_PROFILE=fernando-moretes AWS_REGION=us-east-1 aws sts get-caller-identity
AWS_PROFILE=fernando-moretes AWS_REGION=us-east-1 aws lambda put-function-concurrency \
  --function-name moretes-aws-architect-mcp --reserved-concurrent-executions 0
```

API Gateway may still receive billed traffic. To close public ingress, remove this stack's `McpRoute`, `HomeRoute`, `HealthRoute` and `ProxyRoute` through a reviewed CloudFormation update (or remove the application stack when retiring it). Keep evidence of the reason and restore only after review. Deleting the stack is destructive to its quota/usage/log records; export needed operational evidence first. The artifact bucket is retained intentionally.

Resume only this function via `delete-function-concurrency` if no reservation existed before. Recheck the quota and endpoint. Use `SERVICE_ENABLED=false` for a logical pause while preserving health/docs; preserve other environment variables when updating it.

## Rollback

Re-deploy the previous reviewed commit and its existing content-addressed artifact key through CloudFormation, preserving domain/certificate and other live parameters. Verify `/health`, protocol smoke from that version and permissions. Never overwrite the old bundle object; keys are SHA-256 based. No business-data migrations are required; persisted state contains quota and aggregate usage counters.

## Release checklist

1. Synchronize package/lock/runtime, server.json, client/plugin manifests, pinned hooks, changelog and generated contracts. Run typecheck, tests, build, audit, docs and package checks.
2. Merge a reviewed PR only after Node 22/24 CI, CodeQL and Action self-test pass.
3. Tag the merged commit (`v<version>`). Publish and Container workflows distribute npm, MCP Registry, SBOM and GHCR with provenance. Check both workflows; npm propagation may take minutes.
4. Create the GitHub release with the actual changes, compatibility constraints and validation. Verify the published npm tarball by clean install and both binaries; verify Registry and image tags separately.
5. Deploy AWS through its reviewed change set. Push/tag alone does not deploy Lambda. Check health, tool count, exact version, the large-queue regression, AWS Knowledge and public account-tool isolation.
6. Check `/stats.json`, `/tools.json` and `/.well-known/mcp/server-card.json`. Statistics count attempted known calls and may be cached/undercounted; never equate them with unique users.

## Maintenance

- Weekly initially: cost, credits, errors, quota utilization and genuine user feedback.
- Before releases: dependency audit, tests on supported Node versions, provider contract checks, source/pricing date review.
- Catalog/package refreshes are reviewable PRs; no automatic upstream version activation.
- Before credit expiry: decide renewal, lower quota or retirement. Do not assume AWS alerts create a spending hard stop.
