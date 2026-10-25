import { z } from 'zod';
export const text = z.string().min(1).max(4000);
export const short = z.string().min(1).max(200);
export const lines = z.array(text).max(30);
export type Definition = {
  name:string; description:string; schema:z.ZodObject; external:boolean;
  mutating?:boolean;
  run:(args:unknown)=>Promise<Record<string,unknown>>;
};
export function tool<S extends z.ZodRawShape>(name:string, description:string, shape:S,
  fn:(args:z.infer<z.ZodObject<S>>)=>Record<string,unknown>|Promise<Record<string,unknown>>, external=false):Definition {
  const schema=z.object(shape).strict();
  return {name, description, schema, external, run:async args=>fn(schema.parse(args))};
}
export const provenance = {
  kind:'heuristic-design-aid', validated:false,
  limitation:'Validate assumptions and current AWS documentation. This is not an official AWS review, security audit, deployment or price quote.',
  sources:['https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html']
};
