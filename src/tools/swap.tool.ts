import { z } from 'zod';
import type { ToolSpec } from './types.js';
import { textResult, formatAmount } from './types.js';
import { AkkaApiError } from '../client/akka-client.js';

export const swapTool: ToolSpec = {
  name: 'akka_get_swap',
  description:
    'Generate a ready-to-sign swap transaction via AKKA DEX aggregator. Returns ' +
    'complete unsigned transaction data (to, data, value, gas) that the user must ' +
    'sign and broadcast. IMPORTANT: This does NOT execute the swap — it only builds ' +
    'the transaction. Use akka_get_quote first to check the expected output amount.',
  inputSchema: {
    chainId: z.number().int().positive().describe(
      'Chain ID (999=HyperEVM, 1=Ethereum, 8453=Base, 42161=Arbitrum, 56=BNB Chain)',
    ),
    src: z.string().describe(
      'Source token address (0xeee...eee for native token)',
    ),
    dst: z.string().describe('Destination token address'),
    amount: z.string().describe('Amount in wei'),
    from: z.string().describe('Wallet address that will execute the swap'),
    slippage: z.number().min(0).max(50).default(1).describe(
      'Slippage tolerance as percentage (0-50, default 1)',
    ),
    includeTokensInfo: z.boolean().optional().default(true).describe(
      'Include token info in response',
    ),
    includeGas: z.boolean().optional().default(true).describe(
      'Include gas estimate',
    ),
  },
  module: 'swap',
  annotations: {
    title: 'Build Swap Transaction',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (raw, client) => {
    const args = raw as {
      chainId: number; src: string; dst: string; amount: string;
      from: string; slippage: number;
      includeTokensInfo?: boolean; includeGas?: boolean;
    };

    try {
      const swap = await client.getSwap(args.chainId, {
        src: args.src,
        dst: args.dst,
        amount: args.amount,
        from: args.from,
        slippage: args.slippage,
        includeTokensInfo: args.includeTokensInfo,
        includeGas: args.includeGas,
      });

      const lines: string[] = [];
      lines.push(`Swap transaction built: ${args.src} → ${args.dst} on chain ${args.chainId}`);
      lines.push(`Slippage: ${args.slippage}%`);
      lines.push(`Expected output (wei): ${swap.dstAmount}`);

      if (swap.srcToken) {
        lines.push(`Source: ${formatAmount(args.amount, swap.srcToken.decimals, swap.srcToken.symbol)}`);
      }
      if (swap.dstToken) {
        lines.push(`Destination: ${formatAmount(swap.dstAmount, swap.dstToken.decimals, swap.dstToken.symbol)}`);
      }
      if (swap.gas) {
        lines.push(`Estimated gas: ${swap.gas}`);
      }

      lines.push('');
      lines.push('Transaction to sign:');
      lines.push(`  to: ${swap.tx.to}`);
      lines.push(`  data: ${swap.tx.data}`);
      lines.push(`  value: ${swap.tx.value}`);
      lines.push(`  gasPrice: ${swap.tx.gasPrice}`);
      lines.push(`  gas: ${swap.tx.gas}`);

      lines.push('');
      lines.push('Raw response:');
      lines.push(JSON.stringify(swap, null, 2));

      return textResult(lines.join('\n'));
    } catch (error) {
      if (error instanceof AkkaApiError) {
        return textResult(`AKKA API error (${error.statusCode}): ${error.apiMessage}`, true);
      }
      return textResult(
        `Failed to build swap transaction: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  },
};
