import { z } from 'zod';
import type { ToolSpec } from './types.js';
import { textResult } from './types.js';
import type { ChainInfo } from '../client/types.js';

const SUPPORTED_CHAINS: ChainInfo[] = [
  { chainId: 999, name: 'HyperEVM (Hyperliquid)', nativeSymbol: 'HYPE' },
  { chainId: 1, name: 'Ethereum', nativeSymbol: 'ETH' },
  { chainId: 8453, name: 'Base', nativeSymbol: 'ETH' },
  { chainId: 42161, name: 'Arbitrum', nativeSymbol: 'ETH' },
  { chainId: 56, name: 'BNB Chain', nativeSymbol: 'BNB' },
];

export const listChainsTool: ToolSpec = {
  name: 'akka_list_chains',
  description:
    'List all blockchain networks supported by AKKA DEX aggregator, including ' +
    'chain IDs, network names, and native token symbols. Use this when a user asks ' +
    'about supported chains or needs to find the right chain ID.',
  inputSchema: {
    // Empty object schema — no parameters needed
    _: z.string().optional().describe('No parameters needed'),
  },
  module: 'info',
  annotations: {
    title: 'List Supported Chains',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async () => {
    const lines: string[] = [];
    lines.push('Supported chains:');
    lines.push('');
    for (const chain of SUPPORTED_CHAINS) {
      lines.push(`  ${chain.chainId} — ${chain.name} (native: ${chain.nativeSymbol})`);
    }
    lines.push('');
    lines.push('Use the native token address 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee for native token swaps.');
    return textResult(lines.join('\n'));
  },
};

export { SUPPORTED_CHAINS };
