import {knowledgeTools} from '../src/knowledge.js';
const cases:Record<string,unknown>={
 aws_knowledge_read:{url:'https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html',maxLength:1000},
 aws_regions:{},
 aws_regional_availability:{regions:['us-east-1'],resourceType:'product',filters:['AWS Lambda']}
};
for(const [name,args]of Object.entries(cases)){
 const result=await knowledgeTools.find(t=>t.name===name)!.run(args);
 if(result.upstreamError)throw new Error(`${name} upstream error`);
 console.log(JSON.stringify({tool:name,status:'passed',bytes:JSON.stringify(result).length}));
}
const search=await knowledgeTools.find(t=>t.name==='aws_knowledge_search')!.run({query:'serverless architecture skill',topic:'agent_skills',limit:1});
// Print only the public search result to select an actual skill ID; never fabricate IDs.
console.log(JSON.stringify(search).slice(0,10000));
