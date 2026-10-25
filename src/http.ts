import {createServer} from 'node:http';
import {handleRequest} from './web.js';
const port=Number(process.env.PORT??8787);
createServer(async(req,res)=>{
 try{
   if(!['127.0.0.1:'+port,'localhost:'+port].includes(req.headers.host??'')){res.writeHead(403).end();return;}
   const chunks:Buffer[]=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>131072){res.writeHead(413).end();return;}chunks.push(chunk);}
   const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
   const request=new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method,headers,...(req.method!=='GET'&&req.method!=='HEAD'?{body:Buffer.concat(chunks)}:{})});
   const response=await handleRequest(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500).end('Request failed');}
}).listen(port,'127.0.0.1',()=>console.error(`Moretes MCP: http://127.0.0.1:${port}/mcp`));
