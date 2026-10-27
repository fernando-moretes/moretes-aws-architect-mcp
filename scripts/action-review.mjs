/** Action runner: report-only suppresses findings (exit 1), never errors (exit 2).
 * Child arguments are passed directly, without shell evaluation or glob expansion.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function runAction({ env = process.env, cwd = process.cwd(), cliArgs = [resolve(root, 'dist/cli.js')] } = {}) {
  let stdout = '', stderr = '';
  try {
    const tool = env.TOOL?.trim();
    if (!tool) throw new Error('tool is required');
    const raw = env.FILES?.trim() ?? '';
    const files = raw.startsWith('[') ? JSON.parse(raw) : raw.split(/\s+/).filter(Boolean);
    if (!Array.isArray(files) || !files.length || files.some(f => typeof f !== 'string' || !f.trim()))
      throw new Error('files must contain at least one path');
    // Absolute paths prevent a filename from becoming a CLI option.
    const paths = files.map(f => resolve(cwd, f));
    const failOn = env.FAIL_ON ?? 'high';
    if (!['', 'high', 'medium', 'info'].includes(failOn)) throw new Error('fail-on must be high, medium, info or empty');
    const sarif = env.SARIF ?? '';
    if (sarif && paths.length !== 1) throw new Error('SARIF output requires exactly one input file');
    const run = args => {
      const child = spawnSync(process.execPath, [...cliArgs, ...args], { cwd, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
      if (child.error) throw child.error;
      stdout += child.stdout ?? '';
      stderr += child.stderr ?? '';
      if (child.status === null || child.status > 1) throw new Error(`CLI execution failed${child.signal ? ` (${child.signal})` : ` (exit ${child.status})`}`);
      return child;
    };
    const review = run(['check', tool, '--fail-on', failOn || 'high', '--format', 'markdown', ...paths]);
    writeFileSync(resolve(cwd, 'review.md'), review.stdout);
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `## Moretes Architect: ${tool}\n\n${review.stdout}\n`);
    if (sarif) {
      const report = run(['call', tool, '--input', paths[0], '--format', 'sarif']);
      JSON.parse(report.stdout); // Do not publish malformed artifacts as successful reports.
      writeFileSync(resolve(cwd, sarif), report.stdout);
    }
    return { code: failOn ? review.status : 0, stdout, stderr };
  } catch (error) {
    return { code: 2, stdout, stderr: stderr + `error: ${error instanceof Error ? error.message : String(error)}\n` };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = runAction();
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.code;
}
