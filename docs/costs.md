# Costs and credits

Deployment region: us-east-1. Monthly operating target: below USD 30. This is a target and alert threshold, not a guarantee of a zero bill.

## Cost drivers

- HTTP API requests and applicable data transfer.
- Lambda requests and duration (256 MB, arm64, timeout 25 seconds).
- DynamoDB: up to two quota updates per accepted request, a monthly update for known tool calls, BatchGetItem for uncached statistics and counter storage.
- CloudWatch logs retained for seven days.
- Private S3 deployment bundles and old versions retained for 30 days.
- Budget notifications; no paid model inference, NAT Gateway, load balancer, ECS/EKS cluster, vector store or provisioned concurrency.

The public AWS Knowledge service has its own availability/rate limits. The user's IDE/model subscription is separate. Optional local Cost Explorer and upstream AWS operations may incur charges in the consumer's account and are not covered by the hosted MCP budget.

## Example sizing scenario, not a price quote

At 3,000 accepted protocol requests/day for 30 days, an assumed 2-second average duration and 0.25 GB memory produce 90,000 invocations and 45,000 GB-seconds. Add quota/usage writes, stats reads, logs, rejected traffic, public GETs, storage and transfer. Apply current regional rates from the primary pricing pages below; this workload scenario is not a quote or a promise of monthly charges. Do not subtract credits or free tiers until confirmed on the bill.

Even a rejected request may consume billed API/Lambda/DynamoDB work. API throttling is best-effort and is not a financial cap. Abusive traffic, larger responses, upstream latency or policy changes alter cost. Review actual cost and duration after the first week before increasing quotas.

Primary pricing pages to verify before changing capacity:
- https://aws.amazon.com/lambda/pricing/
- https://aws.amazon.com/api-gateway/pricing/
- https://aws.amazon.com/dynamodb/pricing/
- https://aws.amazon.com/cloudwatch/pricing/
- https://aws.amazon.com/s3/pricing/

## Controls in the deployed template

- API Gateway default rate 5 requests/second, burst 20.
- 3,000 accepted JSON MCP requests/day globally and 300 per pseudonymous caller, counted atomically. Initialization/discovery consume quota. NAT/proxy callers share a source-IP quota; public GET endpoints are outside these MCP counters.
- Payload 128 KiB, no JSON-RPC batch execution, bounded output and upstream deadlines.
- Quota-store failure denies requests; UTC-day rollover resets service allowance.
- Gross-cost budget USD 30 with 50% and 80% actual alerts and 100% forecast alert.
- Cost allocation tag `Project=moretes-aws-architect-mcp`. The tag must be active in billing; reporting can lag. The deployment operator verified it active.
- Logs exclude bodies and credentials. Quota TTL is 2 days; monthly per-tool TTL is 400 days. Statistics cache for 10 minutes. No fixed-capacity compute is provisioned.

The owner's account concurrency quota is shared with other applications. This stack does not reserve or reduce their concurrency. For stronger isolation, request a sufficient account quota and review a dedicated reserved concurrency setting.

## Credits

The operator verified active credits and eligible core service categories in the authenticated billing console before deployment. Private balances, credit IDs and billing screenshots are deliberately excluded from this public repository. Credits apply according to AWS terms, eligible services, expiry and other account consumption; they are not dedicated exclusively to this project.

Check the billing console before increasing load and ahead of credit expiration. Taxes, excluded services, depleted credits and billing delays can still result in payment. The owner must retain a shutdown decision and review gross costs independently of credits. See the [runbook](operations.md).
