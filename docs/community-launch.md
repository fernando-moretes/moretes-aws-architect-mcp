# Community article — Moretes Architect MCP v0.4.1

Published on 27 October 2026 after verifying npm, MCP Registry, GHCR and the public endpoint. [Read the article on AWS Builder Center](https://builder.aws.com/content/3LG9zeg26cFutfBhZyuZJA39MRX/give-your-aws-architecture-agent-tools-you-can-test-an-open-source-mcp-workbench).

The Builder editor accepts uploaded JPG/PNG/WebP images. The two original project screenshots were uploaded through that editor; animated GIFs remain linked to the immutable v0.4.1 README assets. The free course is linked beside the examples. The text below records the published article.

## Title

Give your AWS architecture agent tools you can test: an open-source MCP workbench

## Description

Try 48 architecture tools for capacity, queues, IaC reviews and agent safety. Two reliability fixes show why deterministic tools still need explicit limits and regression tests.

## Article

An architecture assistant can explain a design convincingly. The harder question is: **can I reproduce the calculation, inspect the assumptions, and make a pipeline fail when the review did not actually run?**

That is the problem I am working on with **Moretes Architect MCP**, an independent, MIT-licensed project. It brings architecture calculations, structured reviews and planning tools into MCP clients, with a CLI for terminals and CI. The v0.4.1 release is also an invitation to the AWS community: try a small, synthetic scenario, challenge the assumptions, and help improve the result.

### What is available today

The public server exposes **48 tools, 20 prompts and 18 resources**. Ten architect personas organize useful perspectives; they are prompt templates, not ten autonomous agents. The toolset covers capacity and latency budgets, queue sizing, disaster recovery, unit economics, diagrams, IAM and infrastructure reviews, API contracts, and agent/MCP configuration checks.

The calculators and rule-based reviews run without model calls inside the server. Live AWS documentation tools are a separate network-backed capability. Your coding assistant may still use a paid model, and local execution still consumes your machine's resources.

The repository also contains a catalog of AWS MCP projects and opt-in local integrations. A catalog entry is discovery information, not a claim that every external server has been tested or is safe to enable automatically.

Project and guide: https://fernando.moretes.com/mcp

Source, examples and issues: https://github.com/fernando-moretes/moretes-aws-architect-mcp

[Claude Code demonstration: requirements_check and architect_panel](https://raw.githubusercontent.com/fernando-moretes/moretes-aws-architect-mcp/v0.4.1/docs/images/ide-requirements-panel.gif)

*A demonstration from the existing project course: gathering missing requirements before recommending a design. The clips contain Portuguese narration/captions; the tool inputs and outputs are available in the repository examples.*

### A three-minute experiment: does this queue have enough headroom?

With Node.js 22.13 or newer, run the pinned CLI:

```bash
npx --yes --package moretes-aws-architect-mcp@0.4.1 moretes-architect call queue_sizing --arg arrivalsPerSecond=900 --arg serviceTimeMs=1000 --arg consumers=1000
```

This is a synthetic scenario: 900 arrivals/second, one second of average service time, and 1,000 concurrent processing slots. The result includes 90% utilization, a wait probability rounded to `0.0006`, and a mean of `900.005` items in the system. It also warns about limited headroom.

These numbers are **an M/M/c model**, not a benchmark of Amazon SQS, Lambda or ECS. Poisson arrivals and exponential service times are simplifying assumptions. Batch size, retries, visibility timeouts, downstream contention, service quotas and bursty traffic can change actual behavior. Use this as a reviewable baseline, then validate against measurements from your workload.

In an MCP client that supports remote Streamable HTTP, add:

```text
https://mcp.moretes.com/mcp
```

Then ask: “Use queue_sizing for 900 arrivals per second, 1000 ms service time and 1000 consumers. Explain its assumptions and what I must measure before applying this to an SQS worker.” Check that the assistant actually calls the tool and distinguishes its returned calculation from its own advice. Client-specific setup examples for Claude, Codex, Kiro and other clients are in the repository documentation.

[Kiro demonstration: latency_budget returns the calculated budget](https://raw.githubusercontent.com/fernando-moretes/moretes-aws-architect-mcp/v0.4.1/docs/images/ide-latency-budget.gif)

*Another calculation workflow from the course: inspecting a latency budget in Kiro. This is a different example from the queue scenario above.*

### What a real bug taught me about deterministic tools

The earlier Erlang C implementation used powers and a direct summation. For sufficiently large inputs, intermediate values could overflow even when the queue itself was stable. A deterministic calculation can be consistently wrong or non-finite.

Version 0.4.1 computes Erlang C through a bounded Erlang B recurrence. It tests large-load results against high-precision reference values and rejects inputs beyond 100,000 total concurrent slots. That bound applies to `consumers × maxConcurrencyPerConsumer`, rather than independently accepting two large values and accidentally multiplying the work.

The lesson is broader than queues: **validate the mathematical model, the numerical implementation and the computational bound separately.** A plausible-looking JSON response is not sufficient evidence of correctness.

Mathematical reference: https://www.columbia.edu/~ww2040/ErlangBandCFormulas.pdf

### A second experiment: report-only must still report execution failures

Architecture reviews often start in report-only mode so that teams can evaluate findings before enforcing a gate. That mode should tolerate findings; it should not conceal a missing input file or malformed JSON.

The GitHub Action now distinguishes three outcomes:

- `0`: the review completed and satisfies the selected policy.
- `1`: findings reached the configured severity threshold.
- `2`: input, execution or artifact-writing error.

With `fail-on: ""`, findings can leave the job green, but errors still fail it. The Action also accepts a JSON array of paths, including filenames with spaces, without shell evaluation. SARIF output is supported for a single input file.

```yaml
- uses: actions/checkout@v4
- uses: fernando-moretes/moretes-aws-architect-mcp@v0.4.1
  with:
    tool: terraform_plan_review
    files: plan.json
    fail-on: ""
    sarif: review.sarif
```

Produce `plan.json` in an earlier step using your normal Terraform workflow, or start with a synthetic fixture. A heuristic review can flag useful patterns; it cannot prove that an infrastructure plan is secure. Inspect findings in context and keep your existing controls.

![Terraform review through the Moretes Architect CLI](https://prod-assets.cosmic.aws.dev/a/3LGBm6dqm4NwJsoOQM14DvTVBId/cli-.webp)

[Watch the animated CLI demonstration: Terraform review findings with an explicit severity gate](https://raw.githubusercontent.com/fernando-moretes/moretes-aws-architect-mcp/v0.4.1/docs/images/cli-terraform-review.gif)

*The CLI example uses `--fail-on high`, so high findings return exit code 1. This differs intentionally from the report-only Action example above.*

### Public exploration and private account access have different boundaries

The public endpoint is intended for documentation and synthetic or non-confidential inputs. It does not expose AWS account tools or local provider dispatch. Account-aware functionality is opt-in in the locally operated server, with AWS credentials and account guards controlled by the operator.

Keep customer plans, secrets and confidential source code local. Do not send those to a public demo. The hosted service has shared quotas, so sustained testing belongs on a local installation or container. Its usage counters measure attempted tool calls, not unique users or validated adoption.

### Help shape the next iteration

If you prefer a guided path, the [free project course](https://fernando.moretes.com/courses/mcp-architect-workbench) walks through installation, requirements, architecture decisions, calculations and reviews. The existing README includes the same demonstrations, and the site provides PT/EN learning material.

![Course lesson on capacity, latency, queues and cost](https://prod-assets.cosmic.aws.dev/a/3LGBrmUNknE4dffg24KAGe3iNAJ/site.webp)

*A lesson from the project course. Treat screenshot UI/version labels as historical examples; the commands in this article are pinned to v0.4.1.*

The release has 50 automated tests, version/contract consistency checks, and clean-package CLI and MCP stdio smoke tests. Those are useful evidence, not a substitute for community feedback across different clients and workloads.

I would especially value three kinds of feedback:

1. A queue or capacity scenario where the documented assumptions are inadequate.
2. An infrastructure review finding that needs better evidence, or a reproducible false positive.
3. A client integration where installation, tool discovery or error reporting is confusing.

Please open a GitHub issue with the version, client, sanitized minimal input, expected outcome and actual result. Synthetic examples are ideal. Documentation improvements and focused PRs are welcome too.

What is one architecture decision you would want a tool to calculate or check before your assistant gives you a recommendation?

Release: https://github.com/fernando-moretes/moretes-aws-architect-mcp/releases/tag/v0.4.1

npm: https://www.npmjs.com/package/moretes-aws-architect-mcp

Issues: https://github.com/fernando-moretes/moretes-aws-architect-mcp/issues

## Slack draft — Portuguese

Pessoal, publiquei a v0.4.1 do Moretes Architect MCP, meu projeto open source (MIT) para apoiar decisões de arquitetura no cliente MCP e no CI. Tem 48 ferramentas públicas para cálculos de capacidade/filas, revisões de IaC e verificações de agentes/MCP. Um exemplo concreto: dimensionar uma fila e ver as hipóteses do modelo antes de levar a recomendação para produção.

Procuro feedback de quem usa Claude, Codex, Kiro ou outros clientes: instalação e descoberta ficaram claras? Algum falso positivo nas revisões? Qual cálculo faz falta no dia a dia?

Guia e instalação: https://fernando.moretes.com/mcp
Código, exemplos e issues: https://github.com/fernando-moretes/moretes-aws-architect-mcp

Para testar, usem dados sintéticos; planos e código confidenciais devem ficar na instalação local. Se encontrarem algo estranho, um exemplo mínimo sanitizado + resultado esperado/obtido ajuda muito. PRs e melhorias na documentação também são bem-vindos!

## Slack draft — English

Hi builders! I released Moretes Architect MCP v0.4.1, my MIT-licensed architecture workbench: 48 public tools for capacity/queue calculations, structured IaC reviews and agent/MCP checks, plus a CLI for CI.

The release fixes two concrete problems: numerical overflow in large stable queues, and report-only reviews hiding execution failures. I wrote a walkthrough with a reproducible queue example and the model's limits.

I'd love feedback on one small synthetic scenario: is tool discovery clear in your MCP client, are the assumptions useful, and can you reproduce a false positive? Please keep confidential plans/code local and share only sanitized examples in issues.

Guide: https://fernando.moretes.com/mcp
Code and issues: https://github.com/fernando-moretes/moretes-aws-architect-mcp

## Sharing log

- AWS Builder article published and public URL confirmed on 27 October 2026. Both uploaded images loaded successfully in the preview, and the three animation links point to versioned source assets.
- Shared once in the community's general content-sharing channel in English and once in its Brazilian channel in Portuguese. Each message invites a small synthetic test, reproducible issues and documentation contributions, with links to the article, course and source.
- Conversation-specific replies and Slack message permalinks are recorded in the local, ignored `.local/community-evidence/` folder; private community conversations are not reproduced in this public repository.
- Follow-up: turn actionable feedback into a minimal reproducer, add a regression test where appropriate, and link the fix back to the original discussion. Distinguish actual tests and contributors from views, likes and attempted tool calls. Avoid duplicate cross-posts and unsolicited bulk DMs.
