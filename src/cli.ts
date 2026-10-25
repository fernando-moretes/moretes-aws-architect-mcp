#!/usr/bin/env node
/**
 * Pipeline CLI: run any public workbench tool locally, without an MCP client,
 * and turn its findings into JSON, Markdown or SARIF with an exit code.
 *
 *   moretes-architect list [--json]
 *   moretes-architect describe <tool>
 *   moretes-architect call <tool> [--input file.json|-] [--arg key=value ...]
 *                                 [--format json|markdown|sarif] [--fail-on high|medium|info]
 *
 * `--input` is the JSON object of tool arguments. For tools that take one big
 * document (terraform_plan_review, cloudformation_review, openapi_review,
 * iam_policy_review, mcp_config_review, kubernetes_manifest_review) the file may
 * be the raw document itself: it is wrapped in the single expected argument.
 * Exit codes: 0 ok, 1 findings at or above --fail-on, 2 usage/input error.
 */
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { publicTools, toolGroups, VERSION } from './server.js';

type Finding = { severity?: string; message?: string; target?: string; path?: string; line?: number; rule?: string };
const WRAP: Record<string, string> = { terraform_plan_review: 'plan', cloudformation_review: 'template', openapi_review: 'document', iam_policy_review: 'policy', mcp_config_review: 'config', code_review_architecture: 'code' };
const RANK: Record<string, number> = { info: 1, medium: 2, high: 3 };

function usage(message?: string): never {
  if (message) console.error(`error: ${message}\n`);
  console.error(`moretes-architect ${VERSION}\n\n  list [--json]                      tools by group\n  describe <tool>                    description and JSON schema\n  call <tool> [--input f|-] [--arg k=v]... [--format json|markdown|sarif] [--fail-on high|medium|info]\n\nExit codes: 0 ok · 1 findings at/above --fail-on · 2 usage or input error`);
  process.exit(2);
}

function readInput(path: string): string {
  return path === '-' ? readFileSync(0, 'utf8') : readFileSync(path, 'utf8');
}

function coerce(value: string): unknown {
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value === 'true' || value === 'false') return value === 'true';
  if (/^[\[{]/.test(value)) { try { return JSON.parse(value); } catch { return value; } }
  return value;
}

function findings(result: Record<string, unknown>): Finding[] {
  return Array.isArray(result.findings) ? result.findings as Finding[] : [];
}

function toMarkdown(tool: string, result: Record<string, unknown>): string {
  const f = findings(result);
  const summary = (result.summary ?? {}) as Record<string, unknown>;
  const lines = [`## ${tool}`, '', ...Object.entries(summary).filter(([, v]) => typeof v === 'number').map(([k, v]) => `- ${k}: ${v}`)];
  if (f.length) {
    lines.push('', '| Severity | Target | Message |', '|---|---|---|');
    for (const x of f) lines.push(`| ${x.severity ?? ''} | ${(x.target ?? x.path ?? (x.line !== undefined ? `line ${x.line}` : '')).toString().replace(/\|/g, '\\|')} | ${(x.message ?? '').replace(/\|/g, '\\|')} |`);
  } else if (!Object.keys(summary).length) {
    lines.push('', '```json', JSON.stringify(result, null, 2), '```');
  } else lines.push('', 'No findings.');
  const limits = (result.limitations ?? (result.limitation ? [result.limitation] : [])) as string[];
  if (limits.length) lines.push('', '_Limitations:_ ' + limits.join(' · '));
  return lines.join('\n') + '\n';
}

function toSarif(tool: string, result: Record<string, unknown>, file?: string) {
  const level = (s?: string) => s === 'high' ? 'error' : s === 'medium' ? 'warning' : 'note';
  const f = findings(result);
  const rules = [...new Set(f.map(x => x.rule ?? `${tool}/${(x.severity ?? 'info')}`))];
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: { driver: { name: 'moretes-architect', version: VERSION, informationUri: 'https://github.com/fernando-moretes/moretes-aws-architect-mcp', rules: rules.map(id => ({ id, shortDescription: { text: id } })) } },
      results: f.map(x => ({
        ruleId: x.rule ?? `${tool}/${x.severity ?? 'info'}`,
        level: level(x.severity),
        message: { text: `${x.target ?? x.path ?? ''}${x.target || x.path ? ': ' : ''}${x.message ?? ''}` },
        ...(file ? { locations: [{ physicalLocation: { artifactLocation: { uri: file }, ...(x.line ? { region: { startLine: x.line } } : {}) } }] } : {})
      }))
    }]
  };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h') usage();
  if (command === 'list') {
    if (rest.includes('--json')) console.log(JSON.stringify(toolGroups.map(g => ({ group: g.group, tools: g.tools.map(t => t.name) })), null, 2));
    else for (const g of toolGroups) { console.log(`\n${g.group}`); for (const t of g.tools) console.log(`  ${t.name.padEnd(30)} ${t.description.split('. ')[0]}`); }
    return;
  }
  if (command === 'describe') {
    const t = publicTools.find(x => x.name === rest[0]);
    if (!t) usage(`unknown tool: ${rest[0]}`);
    console.log(JSON.stringify({ name: t.name, description: t.description, external: t.external, inputSchema: z.toJSONSchema(t.schema) }, null, 2));
    return;
  }
  if (command !== 'call') usage(`unknown command: ${command}`);
  const name = rest[0];
  const t = publicTools.find(x => x.name === name);
  if (!t) usage(`unknown tool: ${name}`);
  let args: Record<string, unknown> = {};
  let format = 'json', failOn: string | undefined, inputFile: string | undefined;
  for (let i = 1; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--input') { inputFile = rest[++i]; if (!inputFile) usage('--input needs a path or -'); }
    else if (a === '--format') { format = rest[++i]; if (!['json', 'markdown', 'sarif'].includes(format)) usage('--format json|markdown|sarif'); }
    else if (a === '--fail-on') { failOn = rest[++i]; if (!failOn || !RANK[failOn]) usage('--fail-on high|medium|info'); }
    else if (a === '--arg') { const kv = rest[++i] ?? ''; const eq = kv.indexOf('='); if (eq < 1) usage('--arg key=value'); args[kv.slice(0, eq)] = coerce(kv.slice(eq + 1)); }
    else usage(`unknown option: ${a}`);
  }
  if (inputFile) {
    const raw = readInput(inputFile);
    const wrap = WRAP[name];
    if (wrap === 'code') args = { ...args, code: raw, filename: args.filename ?? (inputFile === '-' ? 'stdin' : inputFile) };
    else {
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { usage('input is not valid JSON'); }
      const obj = parsed as Record<string, unknown>;
      const keys = Object.keys((z.toJSONSchema(t.schema) as { properties?: Record<string, unknown> }).properties ?? {});
      const looksLikeArgs = !Array.isArray(parsed) && Object.keys(obj).some(k => keys.includes(k));
      if (wrap && !looksLikeArgs) args = { ...args, [wrap]: obj };
      else if (name === 'kubernetes_manifest_review' && Array.isArray(parsed)) args = { ...args, manifests: parsed };
      else args = { ...obj, ...args };
    }
  }
  let result: Record<string, unknown>;
  try { result = await t.run(args); }
  catch (error) {
    const detail = error instanceof z.ZodError ? 'Invalid input: ' + error.issues.map(i => i.path.join('.') + ': ' + i.message).join('; ') : error instanceof Error ? error.message : String(error);
    console.error(`error: ${detail}`);
    process.exit(2);
  }
  if (format === 'json') console.log(JSON.stringify(result, null, 2));
  else if (format === 'markdown') console.log(toMarkdown(name, result));
  else console.log(JSON.stringify(toSarif(name, result, inputFile && inputFile !== '-' ? inputFile : undefined), null, 2));
  if (failOn) {
    const worst = Math.max(0, ...findings(result).map(f => RANK[f.severity ?? ''] ?? 0));
    if (worst >= RANK[failOn]) process.exit(1);
  }
}

main().catch(error => { console.error(`error: ${error instanceof Error ? error.message : String(error)}`); process.exit(2); });
