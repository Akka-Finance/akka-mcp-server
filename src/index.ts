#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig } from './config.js';
import { AkkaClient } from './client/akka-client.js';
import { registerAllTools } from './tools/registry.js';
import { startStdio } from './transport/stdio.js';
import { startHttp } from './transport/http.js';

const SERVER_NAME = 'akka-defi';
const SERVER_VERSION = '1.0.0';

const INSTRUCTIONS =
  'AKKA is a DEX aggregator for EVM chains. Use akka_list_chains to see supported ' +
  'networks. Use akka_get_quote before akka_get_swap to check expected output. ' +
  'Token amounts are in wei (smallest unit) — use akka_get_token to find decimals. ' +
  'For ERC-20 swaps, check allowance with akka_check_allowance before swapping. ' +
  'Native token address: 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.';

async function main(): Promise<void> {
  const config = loadConfig();

  console.error(`[akka-mcp] API base: ${config.apiBase}`);
  console.error(`[akka-mcp] Transport: ${config.transport}`);

  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  );

  const client = new AkkaClient(config);
  registerAllTools(server, client);

  if (config.transport === 'http') {
    await startHttp(server, config);
  } else {
    await startStdio(server);
  }
}

main().catch((error) => {
  console.error('[akka-mcp] Fatal error:', error);
  process.exit(1);
});
