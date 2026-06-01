import { z } from 'zod';
import type { ToolSpec } from './types.js';
import { textResult } from './types.js';
import { AkkaApiError } from '../client/akka-client.js';

export const listTokensTool: ToolSpec = {
  name: 'akka_list_tokens',
  description:
    'List available tokens for swapping on a given chain. Returns token symbols, ' +
    'names, addresses, decimals, USD prices, and verification status. Use this to ' +
    'discover tradeable tokens or look up a token\'s contract address by symbol.',
  inputSchema: {
    chainId: z.number().int().positive().describe('Chain ID'),
    page: z.number().int().min(0).optional().default(0).describe(
      'Page number (0-based)',
    ),
    limit: z.number().int().min(1).max(1000).optional().default(50).describe(
      'Tokens per page (default 50, max 1000)',
    ),
    verified: z.boolean().optional().describe(
      'Filter to verified tokens only',
    ),
  },
  module: 'tokens',
  annotations: {
    title: 'List Tokens',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (raw, client) => {
    const args = raw as { chainId: number; page?: number; limit?: number; verified?: boolean };

    try {
      const result = await client.getTokens(args.chainId, {
        page: args.page,
        limit: args.limit,
        verified: args.verified,
      });

      const entries = Object.entries(result.tokens);
      const lines: string[] = [];
      lines.push(`Tokens on chain ${args.chainId} (page ${args.page ?? 0}, showing ${entries.length}):`);
      lines.push('');

      for (const [address, token] of entries) {
        const price = token.buyPriceUsd != null ? ` | $${token.buyPriceUsd}` : '';
        const verified = token.verified ? ' [verified]' : '';
        lines.push(
          `  ${token.symbol} (${token.name}) — ${address} | ${token.decimals} decimals${price}${verified}`,
        );
      }

      return textResult(lines.join('\n'));
    } catch (error) {
      if (error instanceof AkkaApiError) {
        return textResult(`AKKA API error (${error.statusCode}): ${error.apiMessage}`, true);
      }
      return textResult(
        `Failed to list tokens: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  },
};
