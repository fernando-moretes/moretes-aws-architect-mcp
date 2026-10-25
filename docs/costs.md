# Costs and credits

Deployment region: us-east-1. Monthly operating target: below USD 30. This is a target and alert threshold, not a guarantee of a zero bill.

## Cost drivers

- HTTP API requests and applicable data transfer.
- Lambda requests and duration (256 MB, arm64, timeout 25 seconds).
- DynamoDB conditional counter updates/reads and a tiny amount of storage.
- CloudWatch logs retained for seven days.
- Private S3 deployment bundles and old versions retained for 30 days.
- Budget notifications; no paid model inference, NAT Gateway, load balancer, ECS/EKS cluster, vector store or provisioned concurrency.

The public AWS Knowledge service has its own availability/rate limits. The user's IDE/model subscription is separate. Optional local Cost Explorer and upstream AWS operations may incur charges in the consumer's account and are not covered by the hosted MCP budget.

## Example sizing scenario, not a price quote

Assume 1,000 successful protocol requests/day, 30 days, 2 seconds average Lambda duration, 0.25 GB memory: 30,000 invocations and 15,000 GB-seconds. At illustrative rates of USD 0.20/million Lambda requests, USD 0.000016667/GB-second and USD 1/million HTTP API requests, these three components total roughly USD 0.29 before DynamoDB, logs, transfer and storage. These conservative calculation inputs are not a promise of exact arm64 regional pricing or full monthly cost. Do not subtract credits or free tiers until confirmed on the bill.

Even a rejected request may consume billed API/Lambda/DynamoDB work. API throttling is best-effort and is not a financial cap. Abusive traffic, larger responses, upstream latency or policy changes alter cost. Review actual cost and duration after the first week before increasing quotas.

Primary pricing pages to verify before changing capacity:
- https://aws.amazon.com/lambda/pricing/
- https://aws.amazon.com/api-gateway/pricing/
- https://aws.amazon.com/dynamodb/pricing/
- https://aws.amazon.com/cloudwatch/pricing/
- https://aws.amazon.com/s3/pricing/

## Controls in the deployed template

- API Gateway default rate 1 request/second, burst 5.
- 1,000 accepted JSON MCP requests/day globally, counted atomically. Initialization/discovery also consume quota.
- Payload 128 KiB, no JSON-RPC batch execution, bounded output and upstream deadlines.
- Quota-store failure denies requests; UTC-day rollover resets service allowance.
- Gross-cost budget USD 30 with 50% and 80% actual alerts and 100% forecast alert.
- Cost allocation tag `Project=moretes-aws-architect-mcp`. The tag must be active in billing; reporting can lag. The deployment operator verified it active.
- Logs exclude bodies and credentials. No fixed-capacity compute is provisioned.

The owner's account concurrency quota is shared with other applications. This stack does not reserve or reduce their concurrency. For stronger isolation, request a sufficient account quota and review a dedicated reserved concurrency setting.

## Credits

The operator verified active credits and eligible core service categories in the authenticated billing console before deployment. Private balances, credit IDs and billing screenshots are deliberately excluded from this public repository. Credits apply according to AWS terms, eligible services, expiry and other account consumption; they are not dedicated exclusively to this project.

Check the billing console before increasing load and ahead of credit expiration. Taxes, excluded services, depleted credits and billing delays can still result in payment. The owner must retain a shutdown decision and review gross costs independently of credits. See the [runbook](operations.md).
