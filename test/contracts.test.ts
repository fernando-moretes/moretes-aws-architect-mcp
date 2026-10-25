import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {createServer, publicTools} from '../src/server.js';

const examples = readdirSync('docs/examples').filter(f => f.endsWith('.json') && f !== 'index.json').map(f => JSON.parse(readFileSync(`docs/examples/${f}`, 'utf8')) as {tool: string; arguments: unknown; result: Record<string, unknown>});

test('every documented example still produces exactly the documented output', async () => {
  assert.ok(examples.length >= 40);
  for (const e of examples) {
    const t = publicTools.find(x => x.name === e.tool);
    assert.ok(t, `example for unknown tool ${e.tool}`);
    const result = await t.run(e.arguments);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), e.result, `${e.tool} output drifted from docs/examples; regenerate with node scripts/examples.mjs and review`);
  }
});

test('tool names, descriptions and input schemas match docs/tools.lock.json', () => {
  const lock = JSON.parse(readFileSync('docs/tools.lock.json', 'utf8')) as {tools: {name: string; sha256: string}[]};
  const sha = (s: string) => createHash('sha256').update(s).digest('hex');
  const now = publicTools.map(t => ({name: t.name, sha256: sha(JSON.stringify({name: t.name, description: t.description, inputSchema: z.toJSONSchema(t.schema)}))}));
  assert.deepEqual(now, lock.tools, 'Tool contract changed; run node scripts/contracts.mjs after npm run build and review the diff');
});

test('SDK client validates every example against the published outputSchema', async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createServer(); const client = new Client({name: 'contracts', version: '1'});
  await server.connect(b); await client.connect(a);
  try {
    const listed = await client.listTools();
    assert.ok(listed.tools.filter(t => t.outputSchema).length >= 40);
    for (const e of examples) {
      const r = await client.callTool({name: e.tool, arguments: e.arguments as Record<string, unknown>});
      assert.ok(!r.isError, `${e.tool} returned an error`);
      assert.ok(r.structuredContent, `${e.tool} missing structuredContent`);
    }
  } finally { await client.close(); await server.close(); }
});
