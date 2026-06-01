import express from 'express';
import { randomUUID } from 'node:crypto';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Config } from '../config.js';

export async function startHttp(server: McpServer, config: Config): Promise<void> {
  const app = express();
  app.use(express.json());

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await server.connect(transport);

  // MCP endpoint — handles POST (tool calls), GET (SSE stream), DELETE (close)
  app.all('/mcp', async (req: any, res: any) => {
    await transport.handleRequest(req, res);
  });

  // Health check for the MCP server itself
  app.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', transport: 'http' });
  });

  app.listen(config.port, () => {
    console.error(`[akka-mcp] HTTP transport listening on http://localhost:${config.port}/mcp`);
  });
}
