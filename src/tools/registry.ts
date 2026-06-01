import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolSpec } from './types.js';
import type { AkkaClient } from '../client/akka-client.js';

import { quoteTool } from './quote.tool.js';
import { swapTool } from './swap.tool.js';
import { dexCompareTool } from './dex-compare.tool.js';
import { approveSpenderTool } from './approve-spender.tool.js';
import { approveTransactionTool } from './approve-transaction.tool.js';
import { checkAllowanceTool } from './check-allowance.tool.js';
import { listTokensTool } from './list-tokens.tool.js';
import { getTokenTool } from './get-token.tool.js';
import { listChainsTool } from './list-chains.tool.js';

const ALL_TOOLS: ToolSpec[] = [
  quoteTool,
  swapTool,
  dexCompareTool,
  approveSpenderTool,
  approveTransactionTool,
  checkAllowanceTool,
  listTokensTool,
  getTokenTool,
  listChainsTool,
];

export function registerAllTools(server: McpServer, client: AkkaClient): void {
  for (const tool of ALL_TOOLS) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema,
      tool.annotations,
      async (args) => tool.handler(args as any, client),
    );
  }

  console.error(`[akka-mcp] Registered ${ALL_TOOLS.length} tools`);
}
