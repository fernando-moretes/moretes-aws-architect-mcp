import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const url=process.argv[2];if(!url)throw new Error('Usage: npm run smoke -- https://endpoint/mcp');
const c=new Client({name:'moretes-smoke',version:'0.2.0'});
try{
 await c.connect(new StreamableHTTPClientTransport(new URL(url)));
 const tools=await c.listTools();
 const capacity=await c.callTool({name:'capacity_plan',arguments:{requestsPerSecond:100,durationMs:200,payloadKB:1}});
 if(capacity.isError||capacity.structuredContent?.averageConcurrency!==20)throw new Error('Capacity smoke failed');
 const knowledge=await c.callTool({name:'aws_knowledge_search',arguments:{query:'AWS Lambda reserved concurrency',limit:1}});
 if(knowledge.isError)throw new Error('Live AWS Knowledge smoke failed');
 const forbidden=await c.callTool({name:'aws_account_identity',arguments:{}});
 if(!forbidden.isError)throw new Error('Public isolation failed');
 console.log(JSON.stringify({endpoint:url,toolCount:tools.tools.length,capacity:'passed',liveKnowledge:'passed',publicIsolation:'passed',resources:(await c.listResources()).resources.length,prompts:(await c.listPrompts()).prompts.length},null,2));
}finally{await c.close();}
