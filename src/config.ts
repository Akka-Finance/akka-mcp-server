import { parseArgs } from 'node:util';

export interface Config {
  apiBase: string;
  apiKey?: string;
  transport: 'stdio' | 'http';
  port: number;
  timeout: number;
}

const DEFAULTS: Config = {
  apiBase: 'https://api.akka.finance',
  apiKey: undefined,
  transport: 'stdio',
  port: 3100,
  timeout: 15000,
};

export function loadConfig(): Config {
  const { values } = parseArgs({
    options: {
      'api-base': { type: 'string' },
      'api-key': { type: 'string' },
      transport: { type: 'string' },
      port: { type: 'string' },
      timeout: { type: 'string' },
    },
    strict: false,
    allowPositionals: true,
  });

  const apiBase = values['api-base'] as string | undefined;
  const apiKey = values['api-key'] as string | undefined;
  const transport = values.transport as string | undefined;
  const port = values.port as string | undefined;
  const timeout = values.timeout as string | undefined;

  return {
    apiBase:
      apiBase ??
      process.env.AKKA_API_BASE ??
      DEFAULTS.apiBase,
    apiKey:
      apiKey ??
      process.env.AKKA_API_KEY ??
      DEFAULTS.apiKey,
    transport:
      (transport as 'stdio' | 'http') ??
      (process.env.AKKA_MCP_TRANSPORT as 'stdio' | 'http') ??
      DEFAULTS.transport,
    port:
      (port ? Number(port) : undefined) ??
      (process.env.AKKA_MCP_PORT ? Number(process.env.AKKA_MCP_PORT) : undefined) ??
      DEFAULTS.port,
    timeout:
      (timeout ? Number(timeout) : undefined) ??
      (process.env.AKKA_TIMEOUT ? Number(process.env.AKKA_TIMEOUT) : undefined) ??
      DEFAULTS.timeout,
  };
}
