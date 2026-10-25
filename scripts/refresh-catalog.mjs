import { mkdir, writeFile } from 'node:fs/promises';
const source = 'https://raw.githubusercontent.com/awslabs/mcp/main/docusaurus/static/assets/server-cards.json';
const response = await fetch(source, {signal: AbortSignal.timeout(15000)});
if (!response.ok) throw new Error(`Catalog ${response.status}`);
const data = await response.json();
if (!Array.isArray(data.servers) || data.servers.length < 20) throw new Error('Unexpected upstream catalog');
const servers = [...new Map(data.servers.map(s=>[s.id,s])).values()].map(s => ({id:s.id, name:s.name, category:s.category,
  tags:s.tags ?? [], sourcePath:s.source_path ?? null,
  sourceUrl:s.source_path?.startsWith('src/') ? `https://github.com/awslabs/mcp/tree/main/${s.source_path}` : 'https://awslabs.github.io/mcp/',
  status:s.id === 'aws-knowledge-mcp-server' ? 'remote-adapter' : 'discovery-only'}));
await mkdir('src/data',{recursive:true});
await writeFile('src/data/catalog.json', JSON.stringify({source, retrievedAt:new Date().toISOString(), servers},null,2)+'\n');
console.log(`Recorded ${servers.length} official entries. Discovery does not imply execution support.`);
