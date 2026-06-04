import type { Config } from '../config.js';
import type {
  QuoteResponse,
  SwapResponse,
  DexCompareResponse,
  SpenderResponse,
  ApproveTransactionResponse,
  AllowanceResponse,
  TokenListResponse,
  TokenItem,
  HealthResponse,
  ApiErrorResponse,
} from './types.js';

export class AkkaApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly apiMessage: string,
    public readonly path: string,
  ) {
    super(`AKKA API ${statusCode}: ${apiMessage}`);
    this.name = 'AkkaApiError';
  }
}

export class AkkaClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: Config) {
    // Strip trailing slash
    this.baseUrl = config.apiBase.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout;
  }

  private async request<T>(path: string, retries = 1): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      apikey: this.apiKey,
    };

    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!res.ok) {
          let apiMsg: string;
          try {
            const body = (await res.json()) as ApiErrorResponse;
            apiMsg = body.message || res.statusText;
          } catch {
            apiMsg = res.statusText;
          }
          const err = new AkkaApiError(res.status, apiMsg, path);
          // Only retry on 5xx
          if (res.status >= 500 && attempt < retries) {
            lastError = err;
            await this.delay(1000);
            continue;
          }
          throw err;
        }

        return (await res.json()) as T;
      } catch (error) {
        if (error instanceof AkkaApiError) throw error;
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < retries) {
          await this.delay(1000);
          continue;
        }
      }
    }

    throw lastError ?? new Error('Request failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildQuery(params: Record<string, string | number | boolean | undefined>): string {
    const qs = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined) {
        qs.set(key, String(val));
      }
    }
    const str = qs.toString();
    return str ? `?${str}` : '';
  }

  // ── Swap endpoints ────────────────────────────────────────────

  async getQuote(
    chainId: number,
    params: {
      src: string;
      dst: string;
      amount: string;
      includeTokensInfo?: boolean;
      includeGas?: boolean;
      includeRoutes?: boolean;
      includeGraph?: boolean;
    },
  ): Promise<QuoteResponse> {
    const qs = this.buildQuery(params);
    return this.request<QuoteResponse>(`/swap/v1/${chainId}/quote${qs}`);
  }

  async getSwap(
    chainId: number,
    params: {
      src: string;
      dst: string;
      amount: string;
      from: string;
      slippage: number;
      gasPrice?: string;
      gasLimit?: number;
      includeTokensInfo?: boolean;
      includeGas?: boolean;
    },
  ): Promise<SwapResponse> {
    const { from, ...rest } = params;
    const qs = this.buildQuery({ ...rest, from, origin: from });
    return this.request<SwapResponse>(`/swap/v1/${chainId}/swap${qs}`);
  }

  async getDexCompare(
    chainId: number,
    params: { src: string; dst: string; amount: string },
  ): Promise<DexCompareResponse> {
    const qs = this.buildQuery(params);
    return this.request<DexCompareResponse>(`/swap/v1/${chainId}/dex-compare${qs}`);
  }

  // ── Approve endpoints ─────────────────────────────────────────

  async getSpender(chainId: number): Promise<SpenderResponse> {
    return this.request<SpenderResponse>(`/swap/v1/${chainId}/approve/spender`);
  }

  async getApproveTransaction(
    chainId: number,
    params: { tokenAddress: string; amount?: string },
  ): Promise<ApproveTransactionResponse> {
    const qs = this.buildQuery(params);
    return this.request<ApproveTransactionResponse>(
      `/swap/v1/${chainId}/approve/transaction${qs}`,
    );
  }

  async getAllowance(
    chainId: number,
    params: { tokenAddress: string; walletAddress: string },
  ): Promise<AllowanceResponse> {
    const qs = this.buildQuery(params);
    return this.request<AllowanceResponse>(
      `/swap/v1/${chainId}/approve/allowance${qs}`,
    );
  }

  // ── Token endpoints ───────────────────────────────────────────

  async getTokens(
    chainId: number,
    params?: { page?: number; limit?: number; verified?: boolean },
  ): Promise<TokenListResponse> {
    const qs = this.buildQuery(params ?? {});
    return this.request<TokenListResponse>(`/${chainId}/tokens${qs}`);
  }

  async getToken(chainId: number, address: string): Promise<TokenItem> {
    return this.request<TokenItem>(`/${chainId}/tokens/${address}`);
  }

  // ── Health ────────────────────────────────────────────────────

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }
}
