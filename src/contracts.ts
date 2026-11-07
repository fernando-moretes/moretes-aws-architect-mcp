import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {Definition} from './definition.js';
import outputSchemas from './data/output-schemas.json' with {type:'json'};

type OutputSchemas = Record<string,{type:'object';[key:string]:unknown}>;
const OUTPUT_SCHEMAS = outputSchemas as OutputSchemas;

/** One descriptor for MCP discovery, CLI inspection and contract fingerprints. */
export function describeTool(t:Definition, schemas:OutputSchemas = OUTPUT_SCHEMAS) {
  return {
    name:t.name, description:t.description,
    inputSchema:z.toJSONSchema(t.schema, {io:'input'}) as {type:'object'},
    ...(schemas[t.name] ? {outputSchema:schemas[t.name]} : {}),
    annotations:{readOnlyHint:!t.mutating, destructiveHint:!!t.mutating, idempotentHint:!t.mutating, openWorldHint:t.external}
  };
}

/** Project-specific canonical JSON: sort object keys recursively; retain array order.
 * JSON values only. This is not RFC 8785, a signature or a trust assessment.
 */
export function contractDigest(value:unknown):string {
  const sort = (v:unknown):unknown => Array.isArray(v) ? v.map(sort) : v !== null && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort((v as Record<string,unknown>)[k])])) : v;
  return createHash('sha256').update(JSON.stringify(sort(value))).digest('hex');
}

export function buildContractManifest(tools:Definition[], version:string, schemas:OutputSchemas = OUTPUT_SCHEMAS) {
  const snapshot = {
    schemaVersion:1,
    server:{name:'moretes-aws-architect',version},
    scope:'public-tools',
    tools:tools.map(t=>describeTool(t,schemas)).sort((a,b)=>a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  };
  return {
    algorithm:'sha256-sorted-json-v1',
    digest:contractDigest(snapshot), snapshot,
    toolDigests:snapshot.tools.map(t=>({name:t.name,digest:contractDigest(t)}))
  };
}
