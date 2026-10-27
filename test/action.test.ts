import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
// The Action is plain Node; use the source CLI in tests so no stale build is tested.
// @ts-expect-error The maintainer script intentionally has no TypeScript declaration.
import {runAction} from '../scripts/action-review.mjs';
const cliArgs=['--import',import.meta.resolve('tsx'),resolve('src/cli.ts')];
function check(files:Record<string,string>,env:Record<string,string>,verify:(r:{code:number;stdout:string;stderr:string},cwd:string)=>void){
 const cwd=mkdtempSync(join(tmpdir(),'moretes-action-'));
 try{
  for(const [name,body] of Object.entries(files))writeFileSync(join(cwd,name),body);
  const result=runAction({cwd,cliArgs,env:{...process.env,TOOL:'iam_policy_review',FILES:'policy.json',FAIL_ON:'',SARIF:'',GITHUB_STEP_SUMMARY:join(cwd,'summary.md'),...env}});
  verify(result,cwd);
 }finally{rmSync(cwd,{recursive:true,force:true});}
}
const risky=JSON.stringify({Statement:[{Effect:'Allow',Action:'*',Resource:'*'}]});
const clean=JSON.stringify({mcpServers:{docs:{url:'https://example.com/mcp'}}});
test('Action report-only permits findings, writes summary and valid SARIF',()=>{
 check({'policy.json':risky},{SARIF:'review.sarif'},(r,cwd)=>{
  assert.equal(r.code,0,r.stderr);
  assert.match(readFileSync(join(cwd,'review.md'),'utf8'),/high/i);
  assert.match(readFileSync(join(cwd,'summary.md'),'utf8'),/iam_policy_review/);
  assert.ok(JSON.parse(readFileSync(join(cwd,'review.sarif'),'utf8')).runs[0].results.length>0);
 });
});
test('Action severity gate fails on findings while a clean review passes',()=>{
 check({'policy.json':risky},{FAIL_ON:'high'},r=>assert.equal(r.code,1));
 check({'policy.json':clean},{TOOL:'mcp_config_review',FAIL_ON:'high'},r=>assert.equal(r.code,0,r.stderr));
});
test('Action report-only fails invalid JSON, missing files and invalid tool/schema',()=>{
 check({'policy.json':'{invalid'},{},r=>{assert.equal(r.code,2);assert.match(r.stderr,/not valid JSON/);});
 check({}, {},r=>assert.equal(r.code,2));
 check({'policy.json':risky},{TOOL:'unknown_tool'},r=>assert.equal(r.code,2));
 check({'policy.json':'{"provider":"unsupported","policy":{}}'},{},r=>assert.equal(r.code,2));
});
test('Action rejects empty files, invalid threshold and multi-file SARIF',()=>{
 check({}, {FILES:''},r=>assert.equal(r.code,2));
 check({}, {FAIL_ON:'low'},r=>assert.equal(r.code,2));
 check({'policy.json':risky,'other.json':risky},{FILES:'policy.json other.json',SARIF:'review.sarif'},r=>{assert.equal(r.code,2);assert.match(r.stderr,/exactly one/);});
});
test('Action JSON path arrays support spaces and do not evaluate shell syntax',()=>{
 const name='policy $(touch injected).json';
 check({[name]:risky},{FILES:JSON.stringify([name])},(r,cwd)=>{assert.equal(r.code,0,r.stderr);assert.equal(existsSync(join(cwd,'injected')),false);});
 check({'one.json':risky,'two.json':risky},{FILES:'one.json two.json',FAIL_ON:'high'},r=>assert.equal(r.code,1));
});
test('Action fails artifact and summary write errors even in report-only mode',()=>{
 check({'policy.json':risky},{SARIF:'missing/report.sarif'},r=>assert.equal(r.code,2));
 check({'policy.json':risky},{GITHUB_STEP_SUMMARY:'/dev/null/missing'},r=>assert.equal(r.code,2));
});
