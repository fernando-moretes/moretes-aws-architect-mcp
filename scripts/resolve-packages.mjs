import {readFile,writeFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('src/data/catalog.json','utf8'));
const packages={};
// Resolve published names from AWS source, never guess package names from display labels.
for(let i=0;i<data.servers.length;i+=5){
 await Promise.all(data.servers.slice(i,i+5).map(async s=>{
  if(!s.sourcePath?.startsWith('src/'))return;
  try{
   const r=await fetch(`https://raw.githubusercontent.com/awslabs/mcp/main/${s.sourcePath.replace(/\/$/,'')}/pyproject.toml`,{signal:AbortSignal.timeout(10000)});
   if(!r.ok)return;
   const toml=await r.text();const name=toml.match(/\[project\][\s\S]*?\nname\s*=\s*"([^"]+)"/)?.[1];
   if(!name?.startsWith('awslabs.'))return;
   const p=await fetch(`https://pypi.org/pypi/${name}/json`,{signal:AbortSignal.timeout(10000)});
   if(!p.ok)return;const meta=await p.json();
   packages[s.id]={package:name,version:meta.info.version,python:meta.info.requires_python,status:'configuration-only',source:s.sourceUrl};
  }catch{console.error(`Could not resolve ${s.id}; leaving discovery-only`);}
 }));
}
await writeFile('src/data/packages.json',JSON.stringify({resolvedAt:new Date().toISOString(),packages},null,2)+'\n');
console.log(`Resolved ${Object.keys(packages).length} version-pinned official packages; not executed.`);
