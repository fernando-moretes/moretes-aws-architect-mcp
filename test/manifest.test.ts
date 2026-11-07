import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {buildContractManifest,contractDigest,describeTool} from '../src/contracts.js';
import {createServer,publicTools,VERSION} from '../src/server.js';
import {handleRequest} from '../src/web.js';

test('canonical contract fingerprints ignore object order, but preserve array semantics',()=>{
  const a={z:1,a:{y:2,x:3},items:['a','b']};
  const b={items:['a','b'],a:{x:3,y:2},z:1};
  // Independent fixed serialization: the function must not just hash itself.
  const expected=createHash('sha256').update('{"a":{"x":3,"y":2},"items":["a","b"],"z":1}').digest('hex');
  assert.equal(contractDigest(a),expected);assert.equal(contractDigest(b),expected);
  assert.notEqual(contractDigest({...a,items:['b','a']}),expected);
  assert.equal(buildContractManifest(publicTools,VERSION).digest,buildContractManifest([...publicTools].reverse(),VERSION).digest);
});

test('contract fingerprints detect output and safety changes, not only input schemas',()=>{
  const tool=publicTools.find(t=>t.name==='capacity_plan')!;
  const descriptor=describeTool(tool);
  assert.notEqual(contractDigest(descriptor),contractDigest({...descriptor,outputSchema:{type:'object'}}));
  assert.notEqual(contractDigest(descriptor),contractDigest({...descriptor,annotations:{...descriptor.annotations,readOnlyHint:false}}));
  assert.notEqual(contractDigest(descriptor),contractDigest({...descriptor,description:'changed'}));
  assert.notEqual(buildContractManifest(publicTools,VERSION).digest,buildContractManifest(publicTools,'next-version').digest);
});

test('complete manifest matches committed baseline and actual MCP discovery',async()=>{
  const manifest=buildContractManifest(publicTools,VERSION);
  const {snapshot,...baseline}=manifest;
  assert.deepEqual({...baseline,schemaVersion:snapshot.schemaVersion,server:snapshot.server,scope:snapshot.scope},JSON.parse(readFileSync('docs/contracts.lock.json','utf8')));
  for(const t of snapshot.tools)assert.equal(manifest.toolDigests.find(d=>d.name===t.name)?.digest,contractDigest(t));
  const [a,b]=InMemoryTransport.createLinkedPair();const server=createServer();const client=new Client({name:'manifest',version:'1'});
  await server.connect(b);await client.connect(a);
  try{
    const discovered=(await client.listTools()).tools;
    assert.deepEqual(snapshot.tools,[...discovered].sort((a,b)=>a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }finally{await client.close();await server.close();}
});

test('public manifest has stable conditional HTTP caching and excludes local opt-ins',async()=>{
  const previous=process.env.ENABLE_AWS_ACCOUNT_TOOLS;
  process.env.ENABLE_AWS_ACCOUNT_TOOLS='true';
  try{
    const response=await handleRequest(new Request('https://test.example/manifest.json'));
    assert.equal(response.status,200);const manifest=await response.json();
    assert.equal(manifest.digest,contractDigest(manifest.snapshot));
    const health=await (await handleRequest(new Request('https://test.example/health'))).json();
    assert.equal(health.contractDigest,manifest.digest);
    assert.equal(manifest.snapshot.tools.length,48);
    assert.ok(!manifest.snapshot.tools.some((t:{name:string})=>['aws_account_identity','aws_cost_history','aws_integration_call'].includes(t.name)));
    const etag=response.headers.get('etag')!;assert.equal(etag,`"${manifest.digest}"`);
    for(const match of [etag,`W/${etag}`,`"old", ${etag}`,'*']){
      const cached=await handleRequest(new Request('https://test.example/manifest.json',{headers:{'if-none-match':match}}));
      assert.equal(cached.status,304);assert.equal(await cached.text(),'');
    }
    assert.equal((await handleRequest(new Request('https://test.example/manifest.json',{headers:{'if-none-match':'"stale"'}}))).status,200);
    assert.equal((await handleRequest(new Request('https://test.example/manifest.json',{headers:{Origin:'https://evil.example'}}))).status,403);
  }finally{if(previous===undefined)delete process.env.ENABLE_AWS_ACCOUNT_TOOLS;else process.env.ENABLE_AWS_ACCOUNT_TOOLS=previous;}
});

test('CLI manifest matches the HTTP snapshot without requiring cloud credentials',async()=>{
  const cli=spawnSync(process.execPath,['--import','tsx','src/cli.ts','manifest'],{encoding:'utf8',timeout:15000});
  assert.equal(cli.status,0,cli.stderr);
  assert.deepEqual(JSON.parse(cli.stdout),await (await handleRequest(new Request('https://test.example/manifest.json'))).json());
  const invalid=spawnSync(process.execPath,['--import','tsx','src/cli.ts','manifest','--unknown'],{encoding:'utf8',timeout:15000});
  assert.equal(invalid.status,2);
});
