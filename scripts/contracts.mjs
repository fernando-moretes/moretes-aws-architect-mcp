// Gera dois contratos a partir do build (dist/) e das saídas reais (docs/examples):
//  - src/data/output-schemas.json: outputSchema por ferramenta, inferido das saídas
//    reais, tolerante (tipo observado ou null, sem campos obrigatórios, campos extras
//    permitidos), para o cliente validar sem quebrar quando um campo opcional aparece.
//  - docs/tools.lock.json: sha256 de nome + descrição + inputSchema de cada ferramenta.
//    Qualquer mudança no que o modelo do cliente lê vira diff revisável (defesa contra
//    "rug pull": descrição que muda depois de aprovada).
// Uso: npm run build && node scripts/contracts.mjs
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {publicTools, VERSION} from '../dist/server.js';

const typeOf = v => v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'number' : typeof v;
function shape(v, depth = 0) {
  const t = typeOf(v);
  if (t === 'null') return {};
  if (t === 'object' && depth < 2) return {type: 'object', properties: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x, depth + 1)])), additionalProperties: true};
  if (t === 'array') return {type: 'array'};
  return {type: t === 'number' ? ['number', 'null'] : [t, 'null']};
}
const schemas = {};
for (const f of readdirSync('docs/examples').filter(f => f.endsWith('.json') && f !== 'index.json')) {
  const e = JSON.parse(readFileSync(`docs/examples/${f}`, 'utf8'));
  const tool = publicTools.find(t => t.name === e.tool);
  if (!tool || tool.external) continue;
  const s = shape(e.result);
  // top-level: objeto sempre; campos opcionais por natureza ficam tolerantes
  schemas[e.tool] = {type: 'object', properties: s.properties, additionalProperties: true};
}
writeFileSync('src/data/output-schemas.json', JSON.stringify(schemas, null, 2) + '\n');
const sha = s => createHash('sha256').update(s).digest('hex');
const tools = publicTools.map(t => ({name: t.name, sha256: sha(JSON.stringify({name: t.name, description: t.description, inputSchema: z.toJSONSchema(t.schema)}))}));
writeFileSync('docs/tools.lock.json', JSON.stringify({version: VERSION, note: 'sha256 of name + description + inputSchema per public tool. Regenerate with node scripts/contracts.mjs; review the diff before merging.', aggregate: sha(tools.map(t => t.sha256).join('')), tools}, null, 2) + '\n');
console.log(`output schemas: ${Object.keys(schemas).length} · lock: ${tools.length} tools`);
