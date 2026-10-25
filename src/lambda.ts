import {createHash} from 'node:crypto';
import {DynamoDBClient,UpdateItemCommand} from '@aws-sdk/client-dynamodb';
import {handleRequest} from './web.js';
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
export async function handler(event:Event){
 const started=Date.now();let status=500;
 try{
  const body=event.body?Buffer.from(event.body,event.isBase64Encoded?'base64':'utf8'):undefined;
  if(body&&body.length>131072){status=413;return {statusCode:status,body:'Payload too large'};}
  const request=new Request('https://mcp.invalid'+event.rawPath,{method:event.requestContext.http.method,headers:event.headers,...(body?{body}:{})});
  const response=await handleRequest(request,()=>consumeQuota(event.requestContext.http.sourceIp));status=response.status;
  return {statusCode:status,headers:Object.fromEntries(response.headers),body:await response.text()};
 }catch{return {statusCode:500,body:'Service error'};}
 finally{console.info(JSON.stringify({requestId:event.requestContext.requestId,status,durationMs:Date.now()-started}));}
}
