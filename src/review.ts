import { z } from 'zod';
import { tool, provenance } from './definition.js';
type Finding = {severity:'high'|'medium'|'info'; path:string; message:string};
function object(v:unknown):Record<string,unknown>{return v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};}
function arr(v:unknown):unknown[]{return Array.isArray(v)?v:[v];}
export function reviewPolicy(policy:unknown):Finding[]{
  const p=object(policy);if(!('Statement' in p))throw new Error('IAM policy requires Statement');
  const results:Finding[]=[];
  arr(p.Statement).forEach((raw,i)=>{
    const s=object(raw),path=`Statement[${i}]`;if(s.Effect!=='Allow')return;
    if(arr(s.Action).some(x=>x==='*'||typeof x==='string'&&x.endsWith(':*')))results.push({severity:'high',path,message:'Broad allowed action; enumerate operations and justify scope.'});
    if('NotAction' in s)results.push({severity:'high',path,message:'Allow with NotAction can grant a broad complement of actions.'});
    if('NotResource' in s)results.push({severity:'high',path,message:'Allow with NotResource authorizes every resource except the exclusions.'});
    if(arr(s.Resource).includes('*'))results.push({severity:'medium',path,message:'Wildcard resource; verify whether each action supports resource-level restrictions.'});
    if(s.Principal==='*'||arr(object(s.Principal).AWS).includes('*'))results.push({severity:'high',path,message:'Wildcard principal; review conditions, public access and cross-account exposure.'});
    if(!s.Condition)results.push({severity:'info',path,message:'No conditions; evaluate source account, source ARN, region and organization boundaries where supported.'});
  });return results;
}
export const reviewTools=[
  tool('iam_policy_review','Inspect an IAM JSON document for broad Allow statements. Heuristic only; use IAM Access Analyzer for authoritative validation.',{policy:z.record(z.string(),z.unknown())},a=>({...provenance,findings:reviewPolicy(a.policy),sources:['https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-policy-validation.html'],limitations:['No effective permission or condition evaluation','Cannot prove policy safety','No account calls or policy changes']})),
  tool('cloudformation_review','Review a CloudFormation JSON template for selected risky configuration patterns. Intrinsic functions are flagged for human review.',{template:z.record(z.string(),z.unknown())},a=>{
    const resources=object(a.template.Resources);if(!Object.keys(resources).length)throw new Error('CloudFormation Resources is required');
    if(Object.keys(resources).length>200)throw new Error('Maximum 200 resources');
    const findings:Finding[]=[];
    for(const [id,raw] of Object.entries(resources)){
      const r=object(raw),p=object(r.Properties),path=`Resources.${id}`;
      if(r.Type==='AWS::S3::Bucket'){
        const b=object(p.PublicAccessBlockConfiguration);
        for(const k of ['BlockPublicAcls','IgnorePublicAcls','BlockPublicPolicy','RestrictPublicBuckets'])if(b[k]!==true)findings.push({severity:'medium',path:path+'.Properties.PublicAccessBlockConfiguration.'+k,message:'Not explicitly true; resolve inherited/account settings and intrinsic functions before judging exposure.'});
      }
      if(r.Type==='AWS::Lambda::Function'&&!p.ReservedConcurrentExecutions)findings.push({severity:'medium',path,message:'No explicit concurrency budget; evaluate account limits and workload isolation.'});
      if(r.Type==='AWS::RDS::DBInstance'&&p.PubliclyAccessible===true)findings.push({severity:'high',path,message:'Database public accessibility enabled; validate network and security group intent.'});
      if(r.Type==='AWS::EC2::SecurityGroup')for(const rule of arr(p.SecurityGroupIngress)){const x=object(rule);if(x.CidrIp==='0.0.0.0/0'||x.CidrIpv6==='::/0')findings.push({severity:'medium',path,message:'Internet-wide ingress; verify required ports and authentication. Public HTTP is not automatically a defect.'});}
      if(r.Type==='AWS::IAM::Policy')findings.push(...reviewPolicy(p.PolicyDocument).map(f=>({...f,path:path+'.'+f.path})));
    }
    return {...provenance,resourceCount:Object.keys(resources).length,findings,limitations:['Static subset of checks, not cfn-lint, Guard or Access Analyzer','No intrinsic evaluation or deployment','Empty findings is not a security approval']};
  })
];
