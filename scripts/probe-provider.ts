// Explicit maintainer validation, not called by the public MCP. May populate the uv cache.
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {verifyAccount} from '../src/account.js';
import packages from '../src/data/packages.json' with {type:'json'};
const id=process.argv[2];const p=(packages.packages as Record<string,{package:string;version:string}>)[id];
if(!p)throw new Error('Select a mapped official provider');
await verifyAccount();
const client=new Client({name:'moretes-provider-validation',version:'0.1.0'});
const transport=new StdioClientTransport({command:'uvx',args:[`${p.package}@${p.version}`],env:{HOME:process.env.HOME!,PATH:process.env.PATH!,AWS_PROFILE:process.env.AWS_PROFILE!,AWS_REGION:'us-east-1',FASTMCP_LOG_LEVEL:'ERROR'},stderr:'pipe'});
transport.stderr?.on('data',()=>{});
const deadline=setTimeout(()=>void client.close(),120000);
try{await client.connect(transport);const tools=(await client.listTools()).tools;console.log(JSON.stringify({id,package:p,tools:tools.map(t=>({name:t.name,inputSchema:t.inputSchema}))},null,2));}finally{clearTimeout(deadline);await client.close();}
