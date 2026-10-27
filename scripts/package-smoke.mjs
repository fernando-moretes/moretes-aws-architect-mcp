/** Build first. Packs and installs the actual artifact in an isolated consumer directory. */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const tmp=mkdtempSync(join(tmpdir(),'moretes-package-'));
function run(cmd,args,cwd=process.cwd()){
 const r=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout:180000,maxBuffer:4*1024*1024});
 assert.equal(r.status,0,`${cmd} failed: ${r.error?.message??r.stderr}`);return r.stdout;
}
try{
 // --package allows verifying the registry artifact after publication with the same checks.
 const supplied=process.argv.indexOf('--package');
 const packed=supplied>=0?process.argv[supplied+1]:join(tmp,JSON.parse(run('npm',['pack','--ignore-scripts','--json','--pack-destination',tmp]))[0].filename);
 assert.ok(packed,'--package needs a package spec or tarball');
 const consumer=join(tmp,'consumer');mkdirSync(consumer);
 run('npm',['install','--ignore-scripts','--no-audit','--no-fund','--no-package-lock','--prefix',consumer,packed]);
 const bin=join(consumer,'node_modules','.bin');
 const groups=JSON.parse(run(join(bin,'moretes-architect'),['list','--json'],consumer));
 assert.equal(groups.flatMap(g=>g.tools).length,48);
 const queue=JSON.parse(run(join(bin,'moretes-architect'),['call','queue_sizing','--arg','arrivalsPerSecond=900','--arg','serviceTimeMs=1000','--arg','consumers=1000'],consumer));
 assert.equal(queue.waitProbability,0.0006);assert.equal(queue.meanInSystem,900.005);
 const client=new Client({name:'package-smoke',version});
 const transport=new StdioClientTransport({command:join(bin,'moretes-aws-architect-mcp'),args:[],stderr:'pipe'});
 transport.stderr?.on('data',()=>{});
 try{
  await client.connect(transport);
  assert.equal(client.getServerVersion()?.version,version);
  assert.equal((await client.listTools()).tools.length,48);
  const result=await client.callTool({name:'queue_sizing',arguments:{arrivalsPerSecond:900,serviceTimeMs:1000,consumers:1000}});
  assert.equal(result.structuredContent?.waitProbability,0.0006);
  assert.equal((await client.callTool({name:'aws_account_identity',arguments:{}})).isError,true);
 }finally{await client.close();}
 console.log(`Package ${version}: clean install, both executable bins, CLI/stdio large queue and public isolation passed`);
}finally{rmSync(tmp,{recursive:true,force:true});}
