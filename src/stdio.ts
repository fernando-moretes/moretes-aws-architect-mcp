#!/usr/bin/env node
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {createServer} from './server.js';
const server=createServer(true);
await server.connect(new StdioServerTransport());
process.on('SIGTERM',()=>void server.close());
process.on('SIGINT',()=>void server.close());
