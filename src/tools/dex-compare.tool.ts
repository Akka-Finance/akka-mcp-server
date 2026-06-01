import { z } from 'zod';
import type { ToolSpec } from './types.js';
import { textResult, formatAmount } from './types.js';
import { AkkaApiError } from '../client/akka-client.js';

export const dexCompareTool: ToolSpec = {
  name: 'akka_dex_compare',
  description:
    'Compare swap quotes across individual DEX pools for a token pair. Returns ' +
    'AKKA\'s aggregated quote alongside the top 3 individual pool quotes, showing ' +
    'how the aggregated route outperforms single-pool swaps. Useful for explaining ' +
    'the routing advantage to users.',
  inputSchema: {
    chainId: z.number().int().positive().describe('Chain ID'),
    src: z.string().describe('Source token address'),
    dst: z.string().describe('Destination token address'),
    amount: z.string().describe('Amount in wei'),
  },
  module: 'swap',
  annotations: {
    title: 'Compare DEX Prices',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (raw, client) => {
    const args = raw as { chainId: number; src: string; dst: string; amount: string };

    try {
      const result = await client.getDexCompare(args.chainId, {
        src: args.src,
        dst: args.dst,
        amount: args.amount,
      });

      const lines: string[] = [];
      lines.push(`DEX Comparison on chain ${args.chainId}`);
      lines.push(`AKKA Aggregated: ${formatAmount(result.akkaQuote, result.decimalsOut)}`);
      lines.push('');
      lines.push('Individual pools (top 3):');

      for (const pool of result.pools) {
        const amt = formatAmount(pool.amountOut, pool.decimalsOut);
        lines.push(`  ${pool.poolType} (${pool.poolAddress}): ${amt}`);
      }

      if (result.pools.length > 0) {
        const bestPool = BigInt(result.pools[0].amountOut);
        const akka = BigInt(result.akkaQuote);
        if (bestPool > 0n) {
          const improvementBps = ((akka - bestPool) * 10000n) / bestPool;
          lines.push('');
          lines.push(
            `AKKA advantage over best single pool: ${Number(improvementBps) / 100}%`,
          );
        }
      }

      lines.push('');
      lines.push('Raw response:');
      lines.push(JSON.stringify(result, null, 2));

      return textResult(lines.join('\n'));
    } catch (error) {
      if (error instanceof AkkaApiError) {
        return textResult(`AKKA API error (${error.statusCode}): ${error.apiMessage}`, true);
      }
      return textResult(
        `Failed to compare DEX prices: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  },
};
