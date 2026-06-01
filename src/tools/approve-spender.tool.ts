import { z } from 'zod';
import type { ToolSpec } from './types.js';
import { textResult } from './types.js';
import { AkkaApiError } from '../client/akka-client.js';

export const approveSpenderTool: ToolSpec = {
  name: 'akka_get_spender',
  description:
    'Get the AKKA Router contract address that needs token approval before swapping ' +
    'ERC-20 tokens. Users must approve this address to spend their tokens. Not needed ' +
    'for native token swaps.',
  inputSchema: {
    chainId: z.number().int().positive().describe('Chain ID'),
  },
  module: 'approve',
  annotations: {
    title: 'Get Spender Address',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (raw, client) => {
    const args = raw as { chainId: number };

    try {
      const result = await client.getSpender(args.chainId);
      return textResult(
        `AKKA Router (spender) on chain ${args.chainId}: ${result.address}\n\n` +
        `Users must approve this address to spend their ERC-20 tokens before swapping.`,
      );
    } catch (error) {
      if (error instanceof AkkaApiError) {
        return textResult(`AKKA API error (${error.statusCode}): ${error.apiMessage}`, true);
      }
      return textResult(
        `Failed to get spender address: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  },
};
