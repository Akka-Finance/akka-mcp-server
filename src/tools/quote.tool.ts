import { z } from 'zod';
import type { ToolSpec } from './types.js';
import { textResult, formatAmount } from './types.js';
import { AkkaApiError } from '../client/akka-client.js';

export const quoteTool: ToolSpec = {
  name: 'akka_get_quote',
  description:
    'Get the best swap quote from AKKA DEX aggregator. Returns the expected output ' +
    'amount for swapping tokens on supported EVM chains. Use this to check prices ' +
    'before executing a swap. Amounts are in wei (the token\'s smallest unit). ' +
    'Use akka_list_chains to find valid chain IDs.',
  inputSchema: {
    chainId: z.number().int().positive().describe(
      'Chain ID (999=HyperEVM, 1116=Core, 50=XDC, 223=B2, 200901=Bitlayer, 4200=Merlin, 60808=BOB)',
    ),
    src: z.string().describe(
      'Source token address (use 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for native token)',
    ),
    dst: z.string().describe('Destination token address'),
    amount: z.string().describe('Amount in wei (smallest unit of the source token)'),
    includeTokensInfo: z.boolean().optional().default(true).describe(
      'Include token symbol/name/decimals in response',
    ),
    includeGas: z.boolean().optional().default(true).describe(
      'Include estimated gas cost',
    ),
  },
  module: 'swap',
  annotations: {
    title: 'Get Swap Quote',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (raw, client) => {
    const args = raw as {
      chainId: number; src: string; dst: string; amount: string;
      includeTokensInfo?: boolean; includeGas?: boolean;
    };

    try {
      const quote = await client.getQuote(args.chainId, {
        src: args.src,
        dst: args.dst,
        amount: args.amount,
        includeTokensInfo: args.includeTokensInfo,
        includeGas: args.includeGas,
      });

      const lines: string[] = [];
      lines.push(`Quote: ${args.src} → ${args.dst} on chain ${args.chainId}`);
      lines.push(`Input amount (wei): ${args.amount}`);
      lines.push(`Output amount (wei): ${quote.dstAmount}`);

      if (quote.srcToken) {
        lines.push(`Source: ${formatAmount(args.amount, quote.srcToken.decimals, quote.srcToken.symbol)}`);
      }
      if (quote.dstToken) {
        lines.push(`Destination: ${formatAmount(quote.dstAmount, quote.dstToken.decimals, quote.dstToken.symbol)}`);
      }
      if (quote.gas) {
        lines.push(`Estimated gas: ${quote.gas}`);
      }
      if (quote.routes && quote.routes.length > 0) {
        lines.push(`Routes: ${quote.routes.length}`);
        for (const route of quote.routes) {
          const path = route.path.map((t) => t.symbol).join(' → ');
          const pools = route.pools.map((p) => `${p.exchange}(${p.poolType})`).join(' → ');
          lines.push(`  ${route.percent}%: ${path} via ${pools}`);
        }
      }

      lines.push('');
      lines.push('Raw response:');
      lines.push(JSON.stringify(quote, null, 2));

      return textResult(lines.join('\n'));
    } catch (error) {
      if (error instanceof AkkaApiError) {
        return textResult(`AKKA API error (${error.statusCode}): ${error.apiMessage}`, true);
      }
      return textResult(
        `Failed to get quote: ${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    }
  },
};
