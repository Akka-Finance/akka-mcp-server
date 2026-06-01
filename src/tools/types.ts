import type { ZodRawShape } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { AkkaClient } from '../client/akka-client.js';

export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: ZodRawShape;
  module: 'swap' | 'approve' | 'tokens' | 'info';
  annotations: ToolAnnotations;
  handler: (args: Record<string, unknown>, client: AkkaClient) => Promise<CallToolResult>;
}

/** Helper to build a text result */
export function textResult(text: string, isError = false): CallToolResult {
  return {
    content: [{ type: 'text', text }],
    ...(isError ? { isError: true } : {}),
  };
}

/** Helper to format token amounts for human readability */
export function formatAmount(wei: string, decimals: number, symbol?: string): string {
  const raw = BigInt(wei);
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  const formatted = fracStr ? `${whole}.${fracStr}` : whole.toString();
  return symbol ? `${formatted} ${symbol}` : formatted;
}
