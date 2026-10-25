# Security and privacy

Report vulnerabilities privately to fernando@moretes.com. Do not include active secrets or private AWS/customer data in public issues. No response-time SLA is promised.

Public HTTP is unauthenticated by design and exposes only architecture/calculation/static-review tools, official documentation adapters and public GitHub metadata. It has no account-resource operations, shell, upload, arbitrary URL fetch, runtime package install, secrets store, paid model calls or tenant delegation.

Public service inputs are processed in memory. AWS Knowledge receives the explicit documentation query/URL/region; GitHub receives the explicit public repository name. Do not submit confidential material. Local mode processes architecture inputs locally, but the model in your chosen client and explicit external tools have their own data policies.

Controls: 128 KiB HTTP body cap, 100 KB tool-argument cap, strict Zod schemas, bounded arrays/text, no batching, deadlines, fail-closed daily quota, denied browser origins by default, loopback-only local HTTP, escaped diagram/HTML labels, minimal logs and scoped Lambda IAM. Resource/tool annotations are hints; server-side checks and IAM are enforcement.

Threats and residual risk:

| Threat | Control | Residual risk |
|---|---|---|
| Public caller accesses owner AWS | Separate public registry and minimal IAM | Deployment/config regressions require continued testing |
| SSRF / credential forwarding | Fixed upstreams, official document host validation, no forwarded credentials | Upstream availability and implementation remain dependencies |
| Prompt injection in docs/repositories | Returned as untrusted source data, no autonomous action | Host model must maintain instruction boundaries |
| Cost abuse | API throttle, atomic global quota, payload/output limits, cost alerts | Throttling/budgets are not absolute billing caps |
| Shared quota exhaustion | Explicit 429 and local alternative | Anonymous users are not individually isolated |
| Malicious official/local package | Version pin, reviewed allowlist, offline launch, minimal env | Trusted subprocess is not sandboxed and can read local files |
| Privileged mutation via federation | Disabled by default, local only, IAM and exact allowlist, destructive annotation | Client user must approve exact operation; do not auto-approve dispatcher |
| False security assurance | Heuristic checks return limitations and unresolved evidence | Human review remains required |

No remote account OAuth, signed approvals, distributed execution ledger or rollback engine is claimed. Do not put an administrative AWS profile in a shared MCP deployment.
