# Project operating notes

- Independent MCP project; do not edit the portfolio checkout to change this server.
- Public HTTP must never expose account tools or local provider dispatch.
- AWS deployment only: profile fernando-moretes, us-east-1. Verify STS identity against the owner's EXPECTED_AWS_ACCOUNT_ID before operations. Do not use QuasarSpace or another account.
- Public runtime IAM is restricted to this stack's logs and quota/usage table (UpdateItem and BatchGetItem). No arbitrary command, URL, paid model or account-resource access.
- Keep logs free of inputs, credentials and customer data.
- Use apply_patch for manual edits. Preserve local work.
- Tests: npm run typecheck; npm test; npm run build; npm audit --omit=dev. Live smoke is separate and sends a public documentation query.
- Deployment: reviewed CloudFormation changeset; no Terraform apply. Gross-cost target USD 30/month is not a spending cap. Verify credit coverage privately; never commit billing details.
- Catalog entry != tested adapter. Keep provenance, versions, boundaries and validation evidence accurate.
- Branches use codex/ prefix; PRs for subsequent changes. No automatic provider version upgrades or auto-approved federation calls.
- Release/handoff: keep CLAUDE.md, CHANGELOG.md, client/plugin manifests and generated contracts consistent. CI validates Node 22/24; npm/Registry and GHCR publication use tag-triggered workflows, AWS deployment remains a separate reviewed change set.
- Deployment script domain flags must include the existing custom domain and certificate on updates; omitted flags currently clear those parameters. Preserve live parameters and inspect the change set before execution.
