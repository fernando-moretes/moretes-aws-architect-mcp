import {DynamoDBClient,UpdateItemCommand} from '@aws-sdk/client-dynamodb';
import {handleRequest} from './web.js';
const db=new DynamoDBClient({region:'us-east-1',maxAttempts:1,requestHandler:{connectionTimeout:1000,requestTimeout:1500}});
type Event={rawPath:string;requestContext:{http:{method:string};requestId?:string};headers:Record<string,string>;body?:string;isBase64Encoded?:boolean};
export async function consumeQuota(){
 const table=process.env.QUOTA_TABLE;
 if(!table)return false;
 const now=new Date(),day=now.toISOString().slice(0,10);
 try{
  await db.send(new UpdateItemCommand({TableName:table,Key:{pk:{S:`global#${day}`}},UpdateExpression:'SET expiresAt = :ttl ADD requests :one',ConditionExpression:'attribute_not_exists(requests) OR requests < :limit',ExpressionAttributeValues:{':ttl':{N:String(Math.floor(now.getTime()/1000)+172800)},':one':{N:'1'},':limit':{N:process.env.DAILY_REQUEST_LIMIT??'1000'}}}));
  return true;
 }catch{return false;}
}
export async function handler(event:Event){
 const started=Date.now();let status=500;
 try{
  const body=event.body?Buffer.from(event.body,event.isBase64Encoded?'base64':'utf8'):undefined;
  if(body&&body.length>131072){status=413;return {statusCode:status,body:'Payload too large'};}
  const request=new Request('https://mcp.invalid'+event.rawPath,{method:event.requestContext.http.method,headers:event.headers,...(body?{body}:{})});
  const response=await handleRequest(request,consumeQuota);status=response.status;
  return {statusCode:status,headers:Object.fromEntries(response.headers),body:await response.text()};
 }catch{return {statusCode:500,body:'Service error'};}
 finally{console.info(JSON.stringify({requestId:event.requestContext.requestId,status,durationMs:Date.now()-started}));}
}
