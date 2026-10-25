# Operations runbook

## Deploy safely

Maintainer deployment scripts are deliberately pinned to `AWS_PROFILE=fernando-moretes`, `us-east-1`, and require `EXPECTED_AWS_ACCOUNT_ID` to match STS. Set that variable to the privately verified owner account before running. Consumers should use their own reviewed fork/deployment configuration. No Terraform apply is used and no existing portfolio resources are adopted or changed.

```sh
AWS_PROFILE=fernando-moretes AWS_REGION=us-east-1 aws sts get-caller-identity
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
python3 scripts/deploy.py --email YOUR_ALERT_EMAIL
```

The default creates/updates the private artifact stack, uploads a content-addressed bundle and **prepares** the service change set. Inspect the printed change-set ARN with `aws cloudformation describe-change-set`, including IAM scope and replacements. Execute that exact reviewed change set with `execute-change-set`, then wait for stack completion. `--execute` is for already-reviewed automated reruns; it does not replace review.

```sh
AWS_PROFILE=fernando-moretes AWS_REGION=us-east-1 aws cloudformation describe-stacks \
  --stack-name moretes-architect-mcp --query 'Stacks[0].Outputs'
npm run smoke -- <MCP_URL>
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

API Gateway may still receive billed traffic. To close public ingress, remove this stack's `McpRoute`, `HomeRoute` and `HealthRoute` through a reviewed CloudFormation update (or remove the application stack when retiring it). Keep evidence of the reason and restore only after review. Deleting the stack is destructive to its quota/log records; export needed operational evidence first. The artifact bucket is retained intentionally.

Resume only this function via `delete-function-concurrency` if no reservation existed before. Recheck the quota and endpoint. Use `SERVICE_ENABLED=false` for a logical pause while preserving health/docs; preserve other environment variables when updating it.

## Rollback

Re-deploy the previous reviewed commit and its existing content-addressed artifact key through CloudFormation. Verify `/health`, protocol smoke and permissions. Never overwrite the old bundle object; keys are SHA-256 based. No data migrations are required because persisted state contains only disposable quota counters.

## Maintenance

- Weekly initially: cost, credits, errors, quota utilization and genuine user feedback.
- Before releases: dependency audit, tests on supported Node versions, provider contract checks, source/pricing date review.
- Catalog/package refreshes are reviewable PRs; no automatic upstream version activation.
- Before credit expiry: decide renewal, lower quota or retirement. Do not assume AWS alerts create a spending hard stop.
