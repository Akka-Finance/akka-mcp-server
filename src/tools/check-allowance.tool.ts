import { z } from 'zod';
import type { ToolSpec } from './types.js';
import { textResult } from './types.js';
import { AkkaApiError } from '../client/akka-client.js';

export const checkAllowanceTool: ToolSpec = {
  name: 'akka_check_allowance',
  description:
    'Check how many tokens the AKKA Router is currently allowed to spend from a ' +
    'wallet. Use this to determine if an approval transaction is needed before ' +
    'swapping. Returns "0" if no approval has been granted. Native token swaps ' +
    '(src = 0xeee...eee) never need approval.',
  inputSchema: {
    chainId: z.number().int().positive().describe('Chain ID'),
    tokenAddress: z.string().describe('ERC-20 token address to check'),
    walletAddress: z.string().describe('Wallet address to check allowance for'),
  },
  module: 'approve',
  annotations: {
    title: 'Check Token Allowance',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (raw, client) => {
    const args = raw as { chainId: number; tokenAddress: string; walletAddress: string };

    try {
      const result = await client.getAllowance(args.chainId, {
        tokenAddress: args.tokenAddress,
        walletAddress: args.walletAddress,
      });

      const hasAllowance = result.allowance !== '0';
      return textResult(
        `Allowance for ${args.tokenAddress} on chain ${args.chainId}:\n` +
        `  Wallet: ${args.walletAddress}\n` +
        `  Current allowance: ${result.allowance}\n` +
        `  Status: ${hasAllowance ? 'Approved' : 'No approval — approval transaction needed before swapping'}`,
      );
    } catch (error) {
      if (error instanceof AkkaApiError) {
        return textResult(`AKKA API error (${error.statusCode}): ${error.apiMessage}`, true);
      }
      return textResult(
        `Failed to check allowance: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  },
};
