import {build} from 'esbuild';
await build({entryPoints:['src/lambda.ts'],outfile:'build/index.mjs',platform:'node',target:'node22',bundle:true,format:'esm',banner:{js:'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);'},minify:true});
