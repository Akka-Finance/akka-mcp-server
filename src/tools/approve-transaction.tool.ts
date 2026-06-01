import { z } from 'zod';
import type { ToolSpec } from './types.js';
import { textResult } from './types.js';
import { AkkaApiError } from '../client/akka-client.js';

export const approveTransactionTool: ToolSpec = {
  name: 'akka_get_approve_tx',
  description:
    'Generate an ERC-20 approve transaction for the AKKA Router. Returns unsigned ' +
    'transaction data (to, data, value) to be signed and sent. Required before ' +
    'swapping ERC-20 tokens (not needed for native tokens). If amount is omitted, ' +
    'grants unlimited approval.',
  inputSchema: {
    chainId: z.number().int().positive().describe('Chain ID'),
    tokenAddress: z.string().describe('ERC-20 token address to approve'),
    amount: z.string().optional().describe(
      'Approval amount in wei (omit for unlimited)',
    ),
  },
  module: 'approve',
  annotations: {
    title: 'Build Approve Transaction',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (raw, client) => {
    const args = raw as { chainId: number; tokenAddress: string; amount?: string };

    try {
      const result = await client.getApproveTransaction(args.chainId, {
        tokenAddress: args.tokenAddress,
        amount: args.amount,
      });

      const lines: string[] = [];
      lines.push(`Approve transaction for token ${args.tokenAddress} on chain ${args.chainId}`);
      lines.push(args.amount ? `Amount: ${args.amount} wei` : 'Amount: unlimited');
      lines.push('');
      lines.push('Transaction to sign:');
      lines.push(`  to: ${result.to}`);
      lines.push(`  data: ${result.data}`);
      lines.push(`  value: ${result.value}`);
      lines.push(`  gasPrice: ${result.gasPrice}`);

      lines.push('');
      lines.push('Raw response:');
      lines.push(JSON.stringify(result, null, 2));

      return textResult(lines.join('\n'));
    } catch (error) {
      if (error instanceof AkkaApiError) {
        return textResult(`AKKA API error (${error.statusCode}): ${error.apiMessage}`, true);
      }
      return textResult(
        `Failed to build approve transaction: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  },
};
