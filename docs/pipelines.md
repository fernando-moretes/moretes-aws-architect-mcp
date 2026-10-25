# Pipelines: the CLI in CI

`dist/cli.js` runs any of the 48 public tools without an MCP client and turns findings into JSON, Markdown or SARIF with an exit code. It is meant for pull-request checks and pre-commit hooks.

Key facts:

- **Local and offline for review tools.** `terraform_plan_review`, `cloudformation_review`, `kubernetes_manifest_review`, `iam_policy_review`, `openapi_review`, `mcp_config_review`, `mcp_server_review`, `code_review_architecture`, `dependency_manifest_review` and every calculator run in memory. No network, no model, nothing leaves the runner, and the public quota does not apply. Only the `aws_knowledge_*`, `aws_regions`, `aws_regional_availability`, `aws_skill` and `github_public_repository` tools call outside, and you would rarely use those in CI.
- **Heuristics.** Findings are triage. Keep OPA/Conftest, Checkov, tfsec, cfn-lint, Kyverno, Spectral or your SAST for enforcement. A clean run is not an approval.
- **No npm registry package yet.** Build from the repository in the job (shown below). `npx -y github:fernando-moretes/moretes-aws-architect-mcp` may work through the `prepare` script but is untested.

## Commands

```text
moretes-architect list [--json]                        tools by group
moretes-architect describe <tool>                      description and JSON schema
moretes-architect call <tool> [--input f|-] [--arg k=v]... [--format json|markdown|sarif] [--fail-on high|medium|info]
```

Until a package is published, `moretes-architect` means `node dist/cli.js` from the built repository.

`--input` takes a JSON file (or `-` for stdin) with the tool arguments. For the tools that take one big document, the file may be the raw document itself and the CLI wraps it in the expected argument:

| Tool | Raw file accepted | Wrapped as |
|---|---|---|
| `terraform_plan_review` | output of `terraform show -json` | `plan` |
| `cloudformation_review` | CloudFormation template (JSON) | `template` |
| `openapi_review` | OpenAPI 3.x document (JSON) | `document` |
| `iam_policy_review` | IAM policy document | `policy` |
| `mcp_config_review` | client configuration with `mcpServers` | `config` |
| `code_review_architecture` | source file, any text | `code` (and `filename` from the path) |
| `kubernetes_manifest_review` | a JSON **array** of manifest objects | `manifests` |

If the file already looks like the tool's arguments (it has one of the schema's property names at the top level), it is passed as is. `--arg key=value` adds or overrides single arguments; numbers, `true`/`false` and values starting with `[` or `{` are parsed.

`dependency_manifest_review` is not in the wrap table because it needs two fields (`filename`, `content`). Build the arguments with `jq` (see the example below).

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Tool ran; no finding at or above `--fail-on` (or `--fail-on` not given) |
| `1` | At least one finding with severity at or above `--fail-on` |
| `2` | Usage or input error: unknown tool or option, invalid JSON, schema validation failure |

Severity ranking: `info` < `medium` < `high`. `--fail-on medium` fails on medium and high.

### Output formats

- `json`: the full tool result, pretty-printed.
- `markdown`: a `## <tool>` section with the numeric summary, a table of findings (severity, target, message) and the tool's limitations. Good for `$GITHUB_STEP_SUMMARY`.
- `sarif`: SARIF 2.1.0 with one run from driver `moretes-architect`. `high` becomes `error`, `medium` becomes `warning`, `info` becomes `note`. `ruleId` is the finding's `rule` or `<tool>/<severity>`. When `--input` is a file path (not `-`), each result gets a `physicalLocation` pointing at that path, with `startLine` when the finding has a line (code reviews). Code scanning needs a location to display an alert, so pass a real path for SARIF.

The SARIF contains only findings (target, message, severity), never the reviewed document.

## Building the CLI in a job

Pin the repository to a commit SHA or a release tag you reviewed. Replace `<COMMIT_OR_TAG>` below.

```yaml
      - name: Check out Moretes Architect
        uses: actions/checkout@v4
        with:
          repository: fernando-moretes/moretes-aws-architect-mcp
          ref: <COMMIT_OR_TAG>
          path: .moretes-architect
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Build the CLI
        run: npm ci --ignore-scripts && npm run build
        working-directory: .moretes-architect
```

After this, the CLI is `node .moretes-architect/dist/cli.js`. Add `.moretes-architect/` to `.gitignore` if the job can commit.

## GitHub Actions: Terraform plan review with SARIF upload

The plan JSON can contain sensitive values. It stays on the runner; do not upload it as an artifact. The review runs with `continue-on-error` so the SARIF is uploaded before the job fails on high findings.

```yaml
name: terraform-review
on:
  pull_request:
    paths: ["infra/**"]
permissions:
  contents: read
  security-events: write   # upload-sarif
  actions: read            # needed by upload-sarif on private repositories
jobs:
  plan-review:
    runs-on: ubuntu-latest
    env:
      TF_IN_AUTOMATION: "true"
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_wrapper: false
      - name: Plan
        working-directory: infra
        run: |
          terraform init -input=false
          terraform plan -input=false -out=tfplan
          terraform show -json tfplan > ../plan.json

      - uses: actions/checkout@v4
        with:
          repository: fernando-moretes/moretes-aws-architect-mcp
          ref: <COMMIT_OR_TAG>
          path: .moretes-architect
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci --ignore-scripts && npm run build
        working-directory: .moretes-architect

      - name: Review plan
        id: review
        continue-on-error: true
        run: |
          node .moretes-architect/dist/cli.js call terraform_plan_review \
            --input plan.json --format sarif --fail-on high > terraform-review.sarif
          node .moretes-architect/dist/cli.js call terraform_plan_review \
            --input plan.json --format markdown >> "$GITHUB_STEP_SUMMARY"
      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: terraform-review.sarif
          category: moretes-architect/terraform
      - name: Fail on high findings
        if: steps.review.outcome == 'failure'
        run: |
          echo "terraform_plan_review found high findings; a human must decide before apply." >&2
          exit 1
```

Notes:

- The first `call` writes the SARIF and sets the exit code. If it exits `1`, the step outcome is `failure` and the last step fails the job after the upload. If it exits `2` (for example the plan JSON is invalid), the SARIF file is empty; check the step log.
- The result's `gate` field says "Block: high findings need a human decision before apply" when any high finding exists. The CLI does not apply anything.
- Alerts appear in the Security tab under the file path given to `--input` (`plan.json`). That file is generated, not committed, so treat the alert as a pointer to the resource address in the message.

## GitHub Actions: Kubernetes manifests via kustomize and yq

The tool wants a JSON array with one object per YAML document. `yq` (mikefarah, v4) converts each document to a JSON line; `jq -s` collects them into an array.

```yaml
name: k8s-review
on:
  pull_request:
    paths: ["deploy/**"]
permissions:
  contents: read
jobs:
  manifests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Render manifests
        run: |
          kubectl kustomize deploy/overlays/prod \
            | yq -o=json -I=0 '.' \
            | jq -s '.' > manifests.json
      - uses: actions/checkout@v4
        with:
          repository: fernando-moretes/moretes-aws-architect-mcp
          ref: <COMMIT_OR_TAG>
          path: .moretes-architect
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci --ignore-scripts && npm run build
        working-directory: .moretes-architect
      - name: Review manifests
        run: |
          node .moretes-architect/dist/cli.js call kubernetes_manifest_review \
            --input manifests.json --format markdown | tee -a "$GITHUB_STEP_SUMMARY"
          node .moretes-architect/dist/cli.js call kubernetes_manifest_review \
            --input manifests.json --fail-on high > /dev/null
```

`ubuntu-latest` runners ship `kubectl`, `yq` and `jq`; pin versions if you need reproducibility. Findings reference `Kind/name/container` (for example `Deployment/orders-api/api`). Without a cluster the tool cannot see admission policies, LimitRanges or defaults, so keep Pod Security Admission or Kyverno as the enforcement layer.

## GitHub Actions: OpenAPI review on pull requests

The tool takes JSON. Convert YAML specs with `yq` first.

```yaml
name: openapi-review
on:
  pull_request:
    paths: ["api/openapi.yaml"]
permissions:
  contents: read
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yq -o=json '.' api/openapi.yaml > openapi.json
      - uses: actions/checkout@v4
        with:
          repository: fernando-moretes/moretes-aws-architect-mcp
          ref: <COMMIT_OR_TAG>
          path: .moretes-architect
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci --ignore-scripts && npm run build
        working-directory: .moretes-architect
      - name: Review OpenAPI document
        run: |
          node .moretes-architect/dist/cli.js call openapi_review \
            --input openapi.json --format markdown | tee -a "$GITHUB_STEP_SUMMARY"
          node .moretes-architect/dist/cli.js call openapi_review \
            --input openapi.json --fail-on medium > /dev/null
```

`--fail-on medium` is a reasonable default for this tool: in the committed example an API with no documented error responses yields 2 medium and 10 info. Style rules (naming, casing, description length) belong to Spectral; this tool covers security, pagination, error responses, idempotency and versioning gaps.

## GitHub Actions: dependency manifest review

`dependency_manifest_review` needs `filename` and `content` (and optionally `lockfilePresent`). Build the arguments with `jq --rawfile` so the file content is passed as a string.

```yaml
name: dependency-review
on:
  pull_request:
    paths: ["package.json", "package-lock.json", "requirements*.txt", "pyproject.toml", "go.mod"]
permissions:
  contents: read
jobs:
  manifests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/checkout@v4
        with:
          repository: fernando-moretes/moretes-aws-architect-mcp
          ref: <COMMIT_OR_TAG>
          path: .moretes-architect
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci --ignore-scripts && npm run build
        working-directory: .moretes-architect
      - name: Review package.json
        run: |
          LOCK=false; [ -f package-lock.json ] && LOCK=true
          jq -n --arg f package.json --rawfile c package.json --argjson lock "$LOCK" \
            '{filename: $f, content: $c, lockfilePresent: $lock}' > deps-args.json
          node .moretes-architect/dist/cli.js call dependency_manifest_review \
            --input deps-args.json --format markdown | tee -a "$GITHUB_STEP_SUMMARY"
          node .moretes-architect/dist/cli.js call dependency_manifest_review \
            --input deps-args.json --fail-on high > /dev/null
```

Do not pass the file content with `--arg content=...`: the CLI parses values that start with `{` as JSON and the schema would reject the object. The tool has no vulnerability data; keep `npm audit`, `pip-audit` or `osv-scanner` in the same workflow.

## GitLab CI

```yaml
iac-review:
  stage: test
  image: node:22
  variables:
    GIT_DEPTH: "1"
  before_script:
    - git clone --depth 1 https://github.com/fernando-moretes/moretes-aws-architect-mcp.git /opt/moretes
    - git -C /opt/moretes checkout <COMMIT_OR_TAG>
    - cd /opt/moretes && npm ci --ignore-scripts && npm run build && cd "$CI_PROJECT_DIR"
  script:
    # plan.json produced by a previous job and passed as an artifact (never publish it)
    - node /opt/moretes/dist/cli.js call terraform_plan_review --input plan.json --format markdown > review.md
    - node /opt/moretes/dist/cli.js call terraform_plan_review --input plan.json --format json > review.json
    - node /opt/moretes/dist/cli.js call terraform_plan_review --input plan.json --fail-on high > /dev/null
  artifacts:
    when: always
    expire_in: 1 week
    paths: [review.md, review.json]
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes: ["infra/**/*"]
```

GitLab does not ingest SARIF for its security dashboard in the same way GitHub does, so this snippet keeps Markdown and JSON as artifacts. Adapt if your instance has a SARIF converter.

## Pre-commit hook

A plain Git hook that reviews staged IAM policy documents and CloudFormation templates. Adjust the paths and the location of the built CLI.

```sh
#!/bin/sh
# .git/hooks/pre-commit  (chmod +x)
CLI="$HOME/src/moretes-aws-architect-mcp/dist/cli.js"
status=0

for f in $(git diff --cached --name-only --diff-filter=ACM -- 'iam/*.json'); do
  node "$CLI" call iam_policy_review --input "$f" --format markdown --fail-on high || status=1
done

for f in $(git diff --cached --name-only --diff-filter=ACM -- 'cfn/*.json'); do
  node "$CLI" call cloudformation_review --input "$f" --format markdown --fail-on high || status=1
done

for f in $(git diff --cached --name-only --diff-filter=ACM -- '*.ts' '*.py' '*.go'); do
  node "$CLI" call code_review_architecture --input "$f" --format markdown --fail-on high || status=1
done

[ "$status" -ne 0 ] && echo "moretes-architect: high findings; commit blocked (use --no-verify to override)" >&2
exit $status
```

With the `pre-commit` framework, a `repo: local` hook with `language: system`, `pass_filenames: false` and the same loop in `entry` works the same way. `code_review_architecture` is regex-based and will flag documented examples; keep the hook on `--fail-on high` and read the message before overriding.

## Reading the result in a script

Use `--format json` and `jq`:

```sh
node dist/cli.js call terraform_plan_review --input plan.json --format json \
  | jq '{gate, summary, high: [.findings[] | select(.severity=="high") | {target, message}]}'
```

Every review result has `findings[]`, `summary` (counts by severity) and `limitations[]`. Calculators have no `findings`, so `--fail-on` never triggers on them; `--format markdown` prints the whole JSON in a code block instead.

## What the CLI does not do

- It does not apply, deploy or change anything.
- It does not fetch plans, templates or manifests; you export them first.
- It does not replace policy as code. The tools say so in their `limitations`.
- It does not call the public endpoint. Everything runs in the Node process on the runner.
