import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {createServer,publicTools} from '../src/server.js';

const capacity = publicTools.find(t=>t.name==='capacity_plan')!;

test('issue 19: 500 peak rps does not invent duration, payload or daily traffic',async()=>{
  const r=await capacity.run({requestsPerSecond:500,rateType:'peak'});
  assert.deepEqual(r.insufficientInputs,['durationMs','payloadKB']);
  for(const field of ['averageConcurrency','plannedConcurrency','dailyRequests','dailyPayloadGB']) assert.equal(r[field],null);
  assert.equal(r.validated,false);
  const p=r.provenance as Record<string,{origin:string;value:unknown}>;
  assert.equal(p.requestsPerSecond.origin,'caller-unspecified');
  assert.equal(p.durationMs.origin,'missing');
  assert.deepEqual(p.headroom,{origin:'server-default',value:1.3});
});

test('issue 19: self-reported premises stay distinct from supplied requirements',async()=>{
  const r=await capacity.run({requestsPerSecond:500,durationMs:250,payloadKB:4,headroom:1.3,inputProvenance:{requestsPerSecond:'provided',durationMs:'assumed',payloadKB:'assumed',headroom:'assumed'}});
  assert.equal(r.averageConcurrency,125);assert.equal(r.plannedConcurrency,163);
  assert.equal(r.dailyPayloadGB,172.8);assert.deepEqual(r.insufficientInputs,[]);
  const p=r.provenance as Record<string,{origin:string}>;
  assert.equal(p.requestsPerSecond.origin,'provided');assert.equal(p.durationMs.origin,'assumed');
  assert.equal(p.headroom.origin,'assumed');assert.equal(r.validated,false);
});

test('partial inputs preserve independent arithmetic and zero is a supplied value',async()=>{
  const r=await capacity.run({requestsPerSecond:0,durationMs:0,payloadKB:0,headroom:1});
  assert.equal(r.plannedConcurrency,0);assert.equal(r.dailyPayloadGB,0);assert.deepEqual(r.insufficientInputs,[]);
  const partial=await capacity.run({requestsPerSecond:500,durationMs:250});
  assert.equal(partial.plannedConcurrency,163);assert.equal(partial.dailyPayloadGB,null);
  const misleading=await capacity.run({requestsPerSecond:500,inputProvenance:{durationMs:'measured',headroom:'measured'}});
  const p=misleading.provenance as Record<string,{origin:string}>;
  assert.equal(p.durationMs.origin,'missing');assert.equal(p.headroom.origin,'server-default');
});

test('SDK exposes partial results and machine-readable validation without supplied secrets',async()=>{
  const [a,b]=InMemoryTransport.createLinkedPair();const server=createServer();const client=new Client({name:'first-use',version:'1'});
  await server.connect(b);await client.connect(a);
  try {
    const listed=await client.listTools();
    const schema=listed.tools.find(t=>t.name==='capacity_plan')!.inputSchema;
    assert.deepEqual(schema.required,['requestsPerSecond']);
    const requirements=listed.tools.find(t=>t.name==='requirements_check')!.inputSchema;
    assert.deepEqual(requirements.required,['workload']);
    const partial=await client.callTool({name:'capacity_plan',arguments:{requestsPerSecond:500}});
    assert.ok(!partial.isError);assert.deepEqual(partial.structuredContent?.insufficientInputs,['durationMs','payloadKB']);
    const missing=await client.callTool({name:'capacity_plan',arguments:{}});
    assert.equal(missing.isError,true);assert.deepEqual(missing.structuredContent?.missing,['requestsPerSecond']);
    const invalid=await client.callTool({name:'capacity_plan',arguments:{requestsPerSecond:-1,durationMs:'private-synthetic-value'}});
    assert.equal(invalid.isError,true);assert.deepEqual(invalid.structuredContent?.missing,[]);
    assert.ok(!JSON.stringify(invalid.structuredContent).includes('private-synthetic-value'));
    const nested=await client.callTool({name:'cost_model',arguments:{items:[{name:'test'}]}});
    assert.ok((nested.structuredContent?.missing as string[]).includes('items.0.pricePerUnit'));
  }finally{await client.close();await server.close();}
});

test('all eight calculators publish consistent evidence metadata without invented citations',async()=>{
  const {readFileSync}=await import('node:fs');
  for(const name of ['capacity_plan','cost_model','slo_budget','latency_budget','queue_sizing','retry_policy','storage_growth','finops_unit_economics']){
    const example=JSON.parse(readFileSync(`docs/examples/${name}.json`,'utf8'));
    const result=await publicTools.find(t=>t.name===name)!.run(example.arguments);
    assert.equal(result.validated,false,name);assert.equal(typeof result.limitation,'string',name);
    assert.ok(Array.isArray(result.sources),name);
  }
});
