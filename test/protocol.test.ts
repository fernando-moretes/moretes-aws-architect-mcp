import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {createServer,publicTools} from '../src/server.js';
import {handleRequest} from '../src/web.js';
import {verifyAccount} from '../src/account.js';
test('MCP client initializes, discovers and invokes tools/resources/prompts',async()=>{
 const [a,b]=InMemoryTransport.createLinkedPair();const server=createServer();const client=new Client({name:'test',version:'1'});
 await server.connect(b);await client.connect(a);
 try{
  const list=await client.listTools();assert.equal(list.tools.length,publicTools.length);assert.ok(list.tools.every(t=>t.annotations?.readOnlyHint));
  assert.ok(list.tools.every(t=>!t.name.startsWith('aws_account')&&t.name!=='aws_cost_history'));
  const r=await client.callTool({name:'capacity_plan',arguments:{requestsPerSecond:10,durationMs:500,payloadKB:2}});assert.equal(r.structuredContent?.averageConcurrency,5);
  const invalid=await client.callTool({name:'capacity_plan',arguments:{requestsPerSecond:-10,durationMs:500,payloadKB:2}});assert.equal(invalid.isError,true);
  const denied=await client.callTool({name:'aws_account_identity'});assert.equal(denied.isError,true);
  assert.ok((await client.listResources()).resources.length>=3);assert.ok((await client.readResource({uri:'moretes://skills/architecture-review'})).contents.length);assert.ok((await client.readResource({uri:'moretes://boundaries'})).contents.length);
  assert.ok((await client.listPrompts()).prompts.length>=14);assert.ok((await client.getPrompt({name:'architect_security'})).messages.length);assert.ok((await client.getPrompt({name:'architecture_discovery'})).messages.length);
 }finally{await client.close();await server.close();}
});
test('real SDK Streamable HTTP client works across stateless requests',async()=>{
 const client=new Client({name:'http-test',version:'1'});
 const transport=new StreamableHTTPClientTransport(new URL('https://test.example/mcp'),{fetch:async(input,init)=>handleRequest(new Request(input,init))});
 await client.connect(transport);
 try{const tools=await client.listTools();assert.equal(tools.tools.length,publicTools.length);const r=await client.callTool({name:'slo_budget',arguments:{availabilityPercent:99,periodDays:1}});assert.ok(r.structuredContent);assert.ok(!r.isError);}finally{await client.close();}
});
test('HTTP rejects cross-origin, unsupported verbs, invalid types, batches and oversized requests',async()=>{
 assert.equal((await handleRequest(new Request('https://t/mcp',{method:'POST',headers:{Origin:'https://evil.example'}}))).status,403);
 assert.equal((await handleRequest(new Request('https://t/mcp'))).status,405);
 assert.equal((await handleRequest(new Request('https://t/.well-known/mcp/server-card.json'))).status,200);
 assert.equal((await handleRequest(new Request('https://t/tools.json'))).status,200);
 assert.equal((await handleRequest(new Request('https://t/mcp',{method:'POST',body:'{}'}))).status,415);
 const headers={'Content-Type':'application/json',Accept:'application/json, text/event-stream'};
 const big=await handleRequest(new Request('https://t/mcp',{method:'POST',headers,body:'x'.repeat(131073)}));assert.equal(big.status,413);
 const batch=await handleRequest(new Request('https://t/mcp',{method:'POST',headers,body:JSON.stringify([{jsonrpc:'2.0',method:'tools/list',id:1}])}));assert.equal(batch.status,400);
 assert.equal((await handleRequest(new Request('https://t/mcp',{method:'POST',headers,body:'{}'}),async()=>false)).status,429);
});
test('public mode cannot acquire account tools even when process opts in',async()=>{
 process.env.ENABLE_AWS_ACCOUNT_TOOLS='true';
 const [a,b]=InMemoryTransport.createLinkedPair(),server=createServer(false),client=new Client({name:'isolation',version:'1'});
 await server.connect(b);await client.connect(a);
 try{assert.ok(!(await client.listTools()).tools.some(t=>t.name==='aws_account_identity'));}finally{delete process.env.ENABLE_AWS_ACCOUNT_TOOLS;await client.close();await server.close();}
});
test('account guard fails closed before any network call',async()=>{delete process.env.ENABLE_AWS_ACCOUNT_TOOLS;await assert.rejects(verifyAccount(),/local stdio/);process.env.ENABLE_AWS_ACCOUNT_TOOLS='true';delete process.env.EXPECTED_AWS_ACCOUNT_ID;await assert.rejects(verifyAccount(),/EXPECTED_AWS_ACCOUNT/);delete process.env.ENABLE_AWS_ACCOUNT_TOOLS;});
test('integration configs are disabled, pinned and not auto-approved',async()=>{const t=publicTools.find(t=>t.name==='integration_config')!;const r=await t.run({serverId:'aws-api-mcp-server'});const c=(r.configuration as any).mcpServers['aws-api-mcp-server'];assert.equal(c.disabled,true);assert.deepEqual(c.autoApprove,[]);assert.ok(!c.args[0].includes('@latest'));});
test('usage counter records only known tool names and stats route answers',async()=>{
 const seen:string[]=[];const headers={'Content-Type':'application/json',Accept:'application/json, text/event-stream'};
 const body=(name:string)=>JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:{availabilityPercent:99,periodDays:1}}});
 await handleRequest(new Request('https://t/mcp',{method:'POST',headers,body:body('slo_budget')}),{countTool:async n=>{seen.push(n);}});
 await handleRequest(new Request('https://t/mcp',{method:'POST',headers,body:body('not_a_tool')}),{countTool:async n=>{seen.push(n);}});
 assert.deepEqual(seen,['slo_budget']);
 const none=await handleRequest(new Request('https://t/stats.json'));assert.equal((await none.json()).available,false);
 const ok=await handleRequest(new Request('https://t/stats.json'),{stats:async()=>({months:{}})});assert.equal(ok.status,200);
});
