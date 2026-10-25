#!/usr/bin/env python3
"""Guarded CloudFormation deployment. Credentials and billing evidence never enter Git."""
import argparse, hashlib, json, os, pathlib, subprocess, zipfile
ROOT=pathlib.Path(__file__).resolve().parent.parent
os.chdir(ROOT)
env={**os.environ,'AWS_PROFILE':'fernando-moretes','AWS_REGION':'us-east-1','AWS_DEFAULT_REGION':'us-east-1','AWS_PAGER':''}
def aws(*args):
    return subprocess.check_output(['aws',*args],env=env,text=True).strip()
parser=argparse.ArgumentParser()
parser.add_argument('--email',required=True)
parser.add_argument('--execute',action='store_true',help='Execute the reviewed application change set; otherwise prepare it only')
args=parser.parse_args()
identity=json.loads(aws('sts','get-caller-identity'))
expected=os.environ.get('EXPECTED_AWS_ACCOUNT_ID')
if not expected or identity['Account']!=expected:raise SystemExit('Set EXPECTED_AWS_ACCOUNT_ID and verify the owner account before deployment')
if not (ROOT/'build/index.mjs').exists():raise SystemExit('Run npm run build first')
subprocess.run(['aws','cloudformation','deploy','--template-file','infra/bootstrap.json','--stack-name','moretes-architect-mcp-artifacts','--no-fail-on-empty-changeset'],env=env,check=True)
bucket=aws('cloudformation','describe-stacks','--stack-name','moretes-architect-mcp-artifacts','--query','Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue|[0]','--output','text')
with zipfile.ZipFile('build/lambda.zip','w',zipfile.ZIP_DEFLATED) as archive:archive.write('build/index.mjs','index.mjs')
digest=hashlib.sha256(pathlib.Path('build/lambda.zip').read_bytes()).hexdigest()
key=f'releases/{digest}.zip'
aws('s3','cp','build/lambda.zip',f's3://{bucket}/{key}','--only-show-errors')
command=['aws','cloudformation','deploy','--template-file','infra/service.json','--stack-name','moretes-architect-mcp','--capabilities','CAPABILITY_IAM','--parameter-overrides',f'ArtifactBucket={bucket}',f'ArtifactKey={key}',f'AlertEmail={args.email}','--no-fail-on-empty-changeset']
if not args.execute:command.append('--no-execute-changeset')
subprocess.run(command,env=env,check=True)
if args.execute:
    output=aws('cloudformation','describe-stacks','--stack-name','moretes-architect-mcp','--query','Stacks[0].Outputs')
    pathlib.Path('.local').mkdir(exist_ok=True)
    pathlib.Path('.local/deployment.json').write_text(output+'\n')
    print(output)
