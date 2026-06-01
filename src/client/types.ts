// Response types mirroring akka-api DTOs

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUri: string | null;
}

export interface Pool {
  address: string;
  fee: number;
  exchange: string;
  poolType: string;
}

export interface TokenInRoute {
  address: string;
  decimals: number;
  symbol: string;
}

export interface Route {
  percent: number;
  pools: Pool[];
  path: TokenInRoute[];
}

export interface GraphStep {
  from: string;
  to: string;
  pool: string;
  exchange: string;
  poolType: string;
  percentage: number;
}

// GET /swap/v1/{chainId}/quote
export interface QuoteResponse {
  dstAmount: string;
  srcToken?: TokenInfo;
  dstToken?: TokenInfo;
  routes?: Route[];
  gas?: string;
  graph?: GraphStep[];
}

// GET /swap/v1/{chainId}/swap
export interface TransactionData {
  from?: string;
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  gas: string;
}

export interface SwapResponse {
  dstAmount: string;
  srcToken?: TokenInfo;
  dstToken?: TokenInfo;
  gas?: string;
  tx: TransactionData;
  encodedTx: string;
}

// GET /swap/v1/{chainId}/dex-compare
export interface DexQuote {
  poolAddress: string;
  poolType: string;
  amountOut: string;
  decimalsOut: number;
}

export interface DexCompareResponse {
  akkaQuote: string;
  decimalsOut: number;
  pools: DexQuote[];
}

// GET /swap/v1/{chainId}/approve/spender
export interface SpenderResponse {
  address: string;
}

// GET /swap/v1/{chainId}/approve/transaction
export interface ApproveTransactionResponse {
  data: string;
  gasPrice: string;
  to: string;
  value: string;
}

// GET /swap/v1/{chainId}/approve/allowance
export interface AllowanceResponse {
  allowance: string;
}

// GET /{chainId}/tokens
export interface TokenItem {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoUri: string | null;
  verified: boolean;
  buyPriceUsd?: number | null;
  sellPriceUsd?: number | null;
}

export interface TokenListResponse {
  tokens: Record<string, TokenItem>;
}

// GET /health
export interface HealthResponse {
  healthy: boolean;
}

// Standard error shape from akka-api
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

// Chain metadata (static)
export interface ChainInfo {
  chainId: number;
  name: string;
  nativeSymbol: string;
}
