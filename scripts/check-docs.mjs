import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const version=json('package.json').version;
for(const [file,get] of [
 ['package-lock.json',x=>x.version],['server.json',x=>x.version],
 ['gemini-extension.json',x=>x.version],['.claude-plugin/plugin.json',x=>x.version],
 ['.claude-plugin/marketplace.json',x=>x.metadata.version],['docs/tools.lock.json',x=>x.version]
])assert.equal(get(json(file)),version,`${file}: release version mismatch`);
assert.equal(json('package-lock.json').packages[''].version,version);
assert.equal(json('.claude-plugin/marketplace.json').plugins[0].version,version);
assert.match(readFileSync('src/version.ts','utf8'),new RegExp(`VERSION = '${version.replaceAll('.','\\.')}'`));
assert.ok(readFileSync('README.md','utf8').includes(`vers%C3%A3o-${version}-`));
assert.ok(readFileSync('.pre-commit-hooks.yaml','utf8').includes(`:${version} cli`));
function docs(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?docs(`${dir}/${e.name}`):e.name.endsWith('.md')?[`${dir}/${e.name}`]:[]);}
const files=[...readdirSync('.').filter(f=>f.endsWith('.md')),...docs('docs'),...docs('skills')];
const missing=[];
for(const file of files){
 const source=readFileSync(file,'utf8').replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm,'');
 const links=[...source.matchAll(/!?\[[^\]]*\]\(([^\s)]+)\)/g)].map(m=>m[1]);
 links.push(...[...source.matchAll(/(?:href|src|srcset)="([^"]+)"/g)].map(m=>m[1]));
 for(const link of links){
  if(/^(?:[a-z][\w+.-]*:|\/|#)/i.test(link))continue;
  const path=decodeURIComponent(link.split('#')[0].split('?')[0]);
  if(path&&!existsSync(resolve(dirname(file),path)))missing.push(`${file}: ${link}`);
 }
}
assert.deepEqual(missing,[],`Broken local documentation links: ${missing.join(', ')}`);
console.log(`Release ${version}: manifests consistent; local links checked in ${files.length} Markdown files`);
