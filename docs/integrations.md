# Official integrations and truthful support levels

The upstream page contains 63 category cards, including the same RODA server in three categories. The snapshot deduplicates by server ID: **61 distinct servers**. Of these, **56** resolved to a published `awslabs.*` package through their official source. Missing mappings stay discovery-only.

## Levels

1. **Live public adapter:** the five AWS Knowledge functions. This is an actual remote MCP connection, not a scraped imitation.
2. **Configuration-only:** a pinned package invocation plus official source link. Not proof that every server's prerequisites are satisfied or that all its tools work.
3. **Local federation:** an installed/cached package can be invoked through the workbench after STS account verification and explicit tool allowlisting. Per-provider functional validation remains necessary.

Examples of catalog specialties include AWS Transform, ECS/EKS, serverless, AgentCore, Bedrock retrieval, DynamoDB, relational databases, SNS/SQS, Step Functions, CloudWatch, CloudTrail, IAM and pricing. Catalog membership alone never enables a tool.

## Recommended workflow

1. Call `integration_catalog` with the required service or capability.
2. Read the official setup and permission requirements linked in the result.
3. Generate configuration with `integration_config`. Inspect pinned version, profile and region.
4. Install/cache only the selected trusted package using its official installation instructions and `uv`.
5. Verify `aws sts get-caller-identity` under the dedicated profile.
6. Discover provider tool names in an isolated client. Create a local allowlist with the exact approved names; never use `*`.
7. Point `MORETES_INTEGRATIONS_FILE` at that absolute JSON path. Set `ENABLE_AWS_ACCOUNT_TOOLS=true`, `EXPECTED_AWS_ACCOUNT_ID`, `AWS_PROFILE` and `AWS_REGION=us-east-1`.
8. Use `aws_integration_tools` to inspect the allowed schemas, then `aws_integration_call`. Keep user confirmation enabled on every call to this dispatcher.

See [example allowlist](../examples/integrations.json). The example is not automatically activated. A missing cache, invalid allowlist, unexpected account or missing tool fails closed. Providers requiring extra environment variables, database endpoints or long-lived jobs may need direct client configuration rather than the v0.1 bridge.

## Update catalog

```sh
npm run catalog:refresh
node scripts/resolve-packages.mjs
git diff -- src/data
npm test
npm run build
```

No `@latest` is used at runtime. Updating catalog versions requires review. The list is an auditable snapshot rather than a guarantee that every upstream is stable or accessible. Managed AWS MCP and other remote services should be connected according to their own authentication documentation.

## Other ecosystems

Public GitHub repository metadata is integrated directly. OpenAI/Anthropic/Kiro are supported MCP clients, not credential-sharing intermediaries. Additional private SaaS integrations need their own scoped authentication adapters and tests; there is no universal credential proxy.
