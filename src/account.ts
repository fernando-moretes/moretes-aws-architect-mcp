import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import {ResourceGroupsTaggingAPIClient, GetResourcesCommand} from '@aws-sdk/client-resource-groups-tagging-api';
import {CostExplorerClient,GetCostAndUsageCommand} from '@aws-sdk/client-cost-explorer';
import {z} from 'zod';
import {tool,short} from './definition.js';
export async function verifyAccount(){
 if(process.env.AWS_LAMBDA_FUNCTION_NAME||process.env.ENABLE_AWS_ACCOUNT_TOOLS!=='true')throw new Error('Account tools are available only in explicitly enabled local stdio mode');
 const expected=process.env.EXPECTED_AWS_ACCOUNT_ID;
 if(!expected||!/^\d{12}$/.test(expected))throw new Error('Set EXPECTED_AWS_ACCOUNT_ID before accessing AWS');
 if(process.env.AWS_REGION!=='us-east-1')throw new Error('This release requires AWS_REGION=us-east-1');
 const result=await new STSClient({region:'us-east-1',maxAttempts:1}).send(new GetCallerIdentityCommand({}));
 if(result.Account!==expected)throw new Error('AWS account mismatch; no resource call made');
 return {account:result.Account,arn:result.Arn,region:'us-east-1'};
}
export const accountTools=[
 tool('aws_account_identity','LOCAL ONLY: authenticated STS identity, pinned to explicitly configured account. Not exposed by the public HTTP server.',{},async()=>({identity:await verifyAccount()}),true),
 tool('aws_tagged_resources','LOCAL ONLY: read a single page of tagged AWS resources in the pinned account; not a complete inventory.',{resourceTypeFilters:z.array(short).max(20).default([]),paginationToken:z.string().max(2048).optional()},async a=>{const identity=await verifyAccount();const r=await new ResourceGroupsTaggingAPIClient({region:'us-east-1',maxAttempts:1}).send(new GetResourcesCommand({ResourcesPerPage:25,ResourceTypeFilters:a.resourceTypeFilters,...(a.paginationToken?{PaginationToken:a.paginationToken}:{})}));return {identity,resources:r.ResourceTagMappingList??[],nextToken:r.PaginationToken,limitation:'Tagging API omits unsupported and never-tagged resources. Tags may be confidential; results stay with your local MCP client.'};},true),
 tool('aws_cost_history','LOCAL ONLY: read daily unblended costs for at most 31 days. Cost Explorer may charge per request; does not report available credits.',{start:z.iso.date(),end:z.iso.date()},async a=>{const days=(Date.parse(a.end)-Date.parse(a.start))/86400000;if(days<=0||days>31)throw new Error('Use an exclusive end date and a window of 1–31 days');const identity=await verifyAccount();const r=await new CostExplorerClient({region:'us-east-1',maxAttempts:1}).send(new GetCostAndUsageCommand({TimePeriod:{Start:a.start,End:a.end},Granularity:'DAILY',Metrics:['UnblendedCost']}));return {identity,results:r.ResultsByTime,limitation:'Billing may lag. This is cost history, not credit balance or a spending cap.'};},true)
];
