import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {approvedIntegration} from '../src/federation.js';
test('federation requires exact owner allowlist and refuses public runtime',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'moretes-test-'));
 const path=join(dir,'config.json');
 await writeFile(path,JSON.stringify({servers:[{id:'aws-documentation-mcp-server',allowTools:['search_documentation']}]}));
 process.env.ENABLE_AWS_ACCOUNT_TOOLS='true';process.env.MORETES_INTEGRATIONS_FILE=path;
 try{
   const r=await approvedIntegration('aws-documentation-mcp-server','search_documentation');assert.equal(r.version,'1.2.3');
   await assert.rejects(approvedIntegration('aws-documentation-mcp-server','delete_resource'),/allowlist/);
   await assert.rejects(approvedIntegration('untrusted-package'),/not approved/);
   process.env.AWS_LAMBDA_FUNCTION_NAME='public';await assert.rejects(approvedIntegration('aws-documentation-mcp-server'),/local-only/);
 }finally{delete process.env.AWS_LAMBDA_FUNCTION_NAME;delete process.env.ENABLE_AWS_ACCOUNT_TOOLS;delete process.env.MORETES_INTEGRATIONS_FILE;await rm(dir,{recursive:true});}
});
