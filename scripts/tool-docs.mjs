import {writeFile} from 'node:fs/promises';
import {publicTools} from '../dist/server.js';
import {accountTools} from '../dist/account.js';
import {federationTools} from '../dist/federation.js';
import {z} from 'zod';
let doc='# Tool reference\n\nGenerated from the registered schemas. Public tools are read-only; local provider calls may mutate resources. Use tools/list in your client for exact current schemas.\n';
for(const [scope,tools]of [['Public HTTP / stdio',publicTools],['Opt-in local account tools',accountTools],['Opt-in local federation',federationTools]]){
 doc+=`\n## ${scope}\n`;
 for(const t of tools){doc+=`\n### ${t.name}\n\n${t.description}\n\nExternal call: ${t.external}. Potentially mutating: ${!!t.mutating}.\n\n\`\`\`json\n${JSON.stringify(z.toJSONSchema(t.schema),null,2)}\n\`\`\`\n`;}
}
await writeFile('docs/tools.md',doc);
