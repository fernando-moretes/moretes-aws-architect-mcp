import {createHash} from 'node:crypto';
import {DynamoDBClient,UpdateItemCommand,BatchGetItemCommand} from '@aws-sdk/client-dynamodb';
import {handleRequest} from './web.js';
import {publicTools,VERSION} from './server.js';
const db=new DynamoDBClient({region:'us-east-1',maxAttempts:1,requestHandler:{connectionTimeout:1000,requestTimeout:1500}});
type Event={rawPath:string;requestContext:{http:{method:string;sourceIp?:string};requestId?:string};headers:Record<string,string>;body?:string;isBase64Encoded?:boolean};
async function count(table:string,pk:string,limit:string,ttl:number){
 try{
  await db.send(new UpdateItemCommand({TableName:table,Key:{pk:{S:pk}},UpdateExpression:'SET expiresAt = :ttl ADD requests :one',ConditionExpression:'attribute_not_exists(requests) OR requests < :limit',ExpressionAttributeValues:{':ttl':{N:String(ttl)},':one':{N:'1'},':limit':{N:limit}}}));
  return true;
 }catch{return false;}
}
/**
 * Two fail-closed counters per UTC day: a global one (protects the budget) and one
 * per caller (protects everyone else from a single noisy consumer). The caller key is
 * sha256(day + source IP) truncated to 24 hex chars: pseudonymous, rotates daily and
 * expires in two days; the raw IP is never stored.
 */
export async function consumeQuota(sourceIp?:string){
 const table=process.env.QUOTA_TABLE;
 if(!table)return false;
 const now=new Date(),day=now.toISOString().slice(0,10),ttl=Math.floor(now.getTime()/1000)+172800;
 if(sourceIp){
  const client=createHash('sha256').update(day+'|'+sourceIp).digest('hex').slice(0,24);
  if(!(await count(table,`client#${client}#${day}`,process.env.CLIENT_DAILY_REQUEST_LIMIT??'300',ttl)))return false;
 }
 return count(table,`global#${day}`,process.env.DAILY_REQUEST_LIMIT??'3000',ttl);
}
/**
 * Usage per tool: one counter per tool per month, key `toolmonth#<name>#<YYYY-MM>`.
 * Only the tool name is recorded; arguments, results and callers never are.
 * Kept 400 days so the public page can show the current and the previous month.
 */
export async function countTool(name:string){
 const table=process.env.QUOTA_TABLE;if(!table)return;
 const now=new Date(),month=now.toISOString().slice(0,7);
 await db.send(new UpdateItemCommand({TableName:table,Key:{pk:{S:`toolmonth#${name}#${month}`}},UpdateExpression:'SET expiresAt = :ttl ADD calls :one',ExpressionAttributeValues:{':ttl':{N:String(Math.floor(now.getTime()/1000)+400*86400)},':one':{N:'1'}}}));
}
let statsCache:{at:number;body:Record<string,unknown>}|null=null;
export async function readStats(){
 if(statsCache&&Date.now()-statsCache.at<600000)return statsCache.body;
 const table=process.env.QUOTA_TABLE;if(!table)throw new Error('no table');
 const now=new Date(),cur=now.toISOString().slice(0,7),prev=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-1,1)).toISOString().slice(0,7);
 const keys=publicTools.flatMap(t=>[cur,prev].map(m=>({pk:{S:`toolmonth#${t.name}#${m}`}})));
 const counts:Record<string,number>={};
 for(let i=0;i<keys.length;i+=100){
  let req:Record<string,{Keys:typeof keys;ProjectionExpression:string}>|undefined={[table]:{Keys:keys.slice(i,i+100),ProjectionExpression:'pk, calls'}};
  for(let tries=0;req&&Object.keys(req).length&&tries<3;tries++){
   const r=await db.send(new BatchGetItemCommand({RequestItems:req}));
   for(const item of r.Responses?.[table]??[])counts[item.pk.S!]=Number(item.calls?.N??0);
   req=r.UnprocessedKeys as typeof req;
  }
 }
 const row=(m:string)=>publicTools.map(t=>({tool:t.name,calls:counts[`toolmonth#${t.name}#${m}`]??0})).sort((a,b)=>b.calls-a.calls);
 const body={version:VERSION,generatedAt:now.toISOString(),note:'Monthly tools/call counts per tool on the public endpoint. Only tool names are counted; arguments, results and callers are never stored.',months:{[cur]:row(cur),[prev]:row(prev)}};
 statsCache={at:Date.now(),body};return body;
}
export async function handler(event:Event){
 const started=Date.now();let status=500;
 try{
  const body=event.body?Buffer.from(event.body,event.isBase64Encoded?'base64':'utf8'):undefined;
  if(body&&body.length>131072){status=413;return {statusCode:status,body:'Payload too large'};}
  const request=new Request('https://mcp.invalid'+event.rawPath,{method:event.requestContext.http.method,headers:event.headers,...(body?{body}:{})});
  const response=await handleRequest(request,{quota:()=>consumeQuota(event.requestContext.http.sourceIp),countTool,stats:readStats});status=response.status;
  return {statusCode:status,headers:Object.fromEntries(response.headers),body:await response.text()};
 }catch{return {statusCode:500,body:'Service error'};}
 finally{console.info(JSON.stringify({requestId:event.requestContext.requestId,status,durationMs:Date.now()-started}));}
}
