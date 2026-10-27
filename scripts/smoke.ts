import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {VERSION} from '../src/version.js';
const url=process.argv[2];if(!url)throw new Error('Usage: npm run smoke -- https://endpoint/mcp');
const c=new Client({name:'moretes-smoke',version:VERSION});
try{
 await c.connect(new StreamableHTTPClientTransport(new URL(url)));
 if(c.getServerVersion()?.version!==VERSION)throw new Error(`Expected release ${VERSION}, received ${c.getServerVersion()?.version}`);
 const tools=await c.listTools();
 if(tools.tools.length!==48)throw new Error('Unexpected public tool count');
 const capacity=await c.callTool({name:'capacity_plan',arguments:{requestsPerSecond:100,durationMs:200,payloadKB:1}});
 if(capacity.isError||capacity.structuredContent?.averageConcurrency!==20)throw new Error('Capacity smoke failed');
 const queue=await c.callTool({name:'queue_sizing',arguments:{arrivalsPerSecond:900,serviceTimeMs:1000,consumers:1000}});
 if(queue.isError||queue.structuredContent?.waitProbability!==0.0006||queue.structuredContent?.meanInSystem!==900.005)throw new Error('Large-queue regression smoke failed');
 const knowledge=await c.callTool({name:'aws_knowledge_search',arguments:{query:'AWS Lambda reserved concurrency',limit:1}});
 if(knowledge.isError)throw new Error('Live AWS Knowledge smoke failed');
 const forbidden=await c.callTool({name:'aws_account_identity',arguments:{}});
 if(!forbidden.isError)throw new Error('Public isolation failed');
 console.log(JSON.stringify({endpoint:url,version:VERSION,toolCount:tools.tools.length,capacity:'passed',largeQueue:'passed',liveKnowledge:'passed',publicIsolation:'passed',resources:(await c.listResources()).resources.length,prompts:(await c.listPrompts()).prompts.length},null,2));
}finally{await c.close();}
