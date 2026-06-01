import { z } from 'zod';
import type { ToolSpec } from './types.js';
import { textResult } from './types.js';
import { AkkaApiError } from '../client/akka-client.js';

export const getTokenTool: ToolSpec = {
  name: 'akka_get_token',
  description:
    'Get detailed information about a specific token by its contract address, ' +
    'including symbol, name, decimals, logo, verification status, and USD price.',
  inputSchema: {
    chainId: z.number().int().positive().describe('Chain ID'),
    address: z.string().describe('Token contract address'),
  },
  module: 'tokens',
  annotations: {
    title: 'Get Token Info',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (raw, client) => {
    const args = raw as { chainId: number; address: string };

    try {
      const token = await client.getToken(args.chainId, args.address);

      const lines: string[] = [];
      lines.push(`${token.symbol} (${token.name})`);
      lines.push(`  Address: ${token.address}`);
      lines.push(`  Decimals: ${token.decimals}`);
      lines.push(`  Verified: ${token.verified}`);
      if (token.buyPriceUsd != null) {
        lines.push(`  Buy price: $${token.buyPriceUsd}`);
      }
      if (token.sellPriceUsd != null) {
        lines.push(`  Sell price: $${token.sellPriceUsd}`);
      }
      if (token.logoUri) {
        lines.push(`  Logo: ${token.logoUri}`);
      }

      return textResult(lines.join('\n'));
    } catch (error) {
      if (error instanceof AkkaApiError) {
        return textResult(`AKKA API error (${error.statusCode}): ${error.apiMessage}`, true);
      }
      return textResult(
        `Failed to get token info: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  },
};
