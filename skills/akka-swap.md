---
title: "AKKA Finance DEX Aggregator"
description: "Skill plugin reference for swapping tokens via AKKA Finance DEX aggregator through Base MCP."
---

# AKKA Finance DEX Aggregator

> [!IMPORTANT]
> Complete the short Base MCP onboarding flow defined in `SKILL.md` before calling any AKKA endpoint.
> The user's wallet address — passed as `from` / `walletAddress` in calls — is fetched via `get_wallets` when needed.

AKKA Finance is a DEX aggregator that finds the optimal swap route across multiple decentralized exchanges on Base. Fetch unsigned calldata from the API, then execute via Base MCP's `send_calls`.

No additional MCP server is required.

**Base URL:** `https://api.akka.finance`

**Chain:** Base mainnet (chainId `8453`)

---

## Read Endpoints

### Get a swap quote

```
GET https://api.akka.finance/swap/v1/8453/quote?src={src}&dst={dst}&amount={amount}&includeTokensInfo=true&includeGas=true
```

| Param | Required | Description |
|-------|----------|-------------|
| src | yes | Source token address (`0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee` for native ETH) |
| dst | yes | Destination token address |
| amount | yes | Amount in wei (smallest unit of source token) |
| includeTokensInfo | no | `true` to include token symbol, name, decimals |
| includeGas | no | `true` to include estimated gas cost |

Response:

```json
{
  "dstAmount": "205340622987446484992",
  "srcToken": { "address": "0x...", "symbol": "ETH", "name": "Ethereum", "decimals": 18, "logoUri": null },
  "dstToken": { "address": "0x...", "symbol": "USDC", "name": "USD Coin", "decimals": 6, "logoUri": null },
  "gas": "2419157"
}
```

`dstAmount` is in wei. Divide by `10^dstToken.decimals` for a human-readable amount. Always show the user the human-readable amount and token symbol.

### Compare DEX prices

```
GET https://api.akka.finance/swap/v1/8453/dex-compare?src={src}&dst={dst}&amount={amount}
```

Response:

```json
{
  "akkaQuote": "205340622987446484992",
  "decimalsOut": 18,
  "pools": [
    { "poolAddress": "0x...", "poolType": "uni_v3", "amountOut": "204100000000000000000", "decimalsOut": 18 },
    { "poolAddress": "0x...", "poolType": "aerodrome", "amountOut": "203800000000000000000", "decimalsOut": 18 }
  ]
}
```

### Check token allowance

```
GET https://api.akka.finance/swap/v1/8453/approve/allowance?tokenAddress={tokenAddress}&walletAddress={walletAddress}
```

Response: `{ "allowance": "0" }`

If `allowance` is `"0"` or less than the swap amount, an approval transaction is needed before swapping. Native ETH swaps (`src = 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`) never need approval.

### Get spender address

```
GET https://api.akka.finance/swap/v1/8453/approve/spender
```

Response: `{ "address": "0x..." }`

### List available tokens

```
GET https://api.akka.finance/8453/tokens?limit=50&page=0&verified=true
```

Response:

```json
{
  "tokens": {
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": {
      "symbol": "USDC", "name": "USD Coin", "decimals": 6,
      "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "logoUri": null, "verified": true, "buyPriceUsd": 1.0, "sellPriceUsd": 1.0
    }
  }
}
```

### Get token by address

```
GET https://api.akka.finance/8453/tokens/{tokenAddress}
```

---

## Prepare Endpoints

### Prepare approval transaction

```
GET https://api.akka.finance/swap/v1/8453/approve/transaction?tokenAddress={tokenAddress}&amount={amount}
```

| Param | Required | Description |
|-------|----------|-------------|
| tokenAddress | yes | ERC-20 token to approve |
| amount | no | Wei amount to approve (omit for unlimited) |

Response:

```json
{
  "data": "0x095ea7b3...",
  "gasPrice": "100000000",
  "to": "0xTokenContractAddress",
  "value": "0"
}
```

### Prepare swap transaction

```
GET https://api.akka.finance/swap/v1/8453/swap?src={src}&dst={dst}&amount={amount}&from={walletAddress}&slippage={slippage}
```

| Param | Required | Description |
|-------|----------|-------------|
| src | yes | Source token address |
| dst | yes | Destination token address |
| amount | yes | Amount in wei |
| from | yes | User's wallet address (from `get_wallets`) |
| slippage | yes | Slippage tolerance as percentage (recommend 1 for stables, 3 for volatile) |

Response:

```json
{
  "dstAmount": "12723902882990271",
  "tx": {
    "from": "0xUserWallet",
    "to": "0xAkkaRouterContract",
    "data": "0x...",
    "value": "1000000000000000000",
    "gasPrice": "1000000000",
    "gas": "231973"
  },
  "encodedTx": "0x..."
}
```

---

## send_calls Mapping

### Native ETH swap (no approval needed)

When `src` is `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`:

```json
{
  "chain": "base",
  "calls": [
    {
      "to": "<swap response .tx.to>",
      "value": "<hex(swap response .tx.value)>",
      "data": "<swap response .tx.data>"
    }
  ]
}
```

### ERC-20 swap WITH approval needed

When the allowance check shows `allowance < amount`:

```json
{
  "chain": "base",
  "calls": [
    {
      "to": "<approve response .to>",
      "value": "0x0",
      "data": "<approve response .data>"
    },
    {
      "to": "<swap response .tx.to>",
      "value": "<hex(swap response .tx.value)>",
      "data": "<swap response .tx.data>"
    }
  ]
}
```

### ERC-20 swap WITHOUT approval needed

When the allowance check shows `allowance >= amount`:

```json
{
  "chain": "base",
  "calls": [
    {
      "to": "<swap response .tx.to>",
      "value": "<hex(swap response .tx.value)>",
      "data": "<swap response .tx.data>"
    }
  ]
}
```

### Value field conversion

The AKKA API returns `value` as a decimal string (e.g. `"1000000000000000000"`). Convert to hex for `send_calls`:

```js
const hexValue = "0x" + BigInt(tx.value).toString(16);
// "0" becomes "0x0"
```

---

## Orchestration

For every swap request, follow this exact sequence:

```
1. get_wallets → walletAddress
2. If user gave token symbols, GET /8453/tokens?verified=true → resolve to contract addresses
   Native ETH is always 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
3. GET /swap/v1/8453/quote?src=...&dst=...&amount=...&includeTokensInfo=true&includeGas=true
   → Show user: human-readable amounts, token symbols, gas estimate
   → Ask for confirmation before proceeding
4. If src is NOT native ETH:
   GET /swap/v1/8453/approve/allowance?tokenAddress={src}&walletAddress={walletAddress}
   → If allowance < amount: GET /swap/v1/8453/approve/transaction?tokenAddress={src}
5. GET /swap/v1/8453/swap?src=...&dst=...&amount=...&from={walletAddress}&slippage=1
6. Build send_calls payload per the mapping above (batch approve + swap if needed)
7. send_calls(chain="base", calls=[...])
8. Show approval URL to user
9. get_request_status(requestId) only after the user acts
```

---

## Slippage Warnings

| Tolerance | Level | Action |
|-----------|-------|--------|
| <= 1% | Normal | Proceed |
| > 1%, <= 5% | Elevated | Mention and confirm |
| > 5%, <= 20% | High | Warn strongly, require confirmation |
| > 20% | Very high | Do not submit without re-confirmation |

---

## Safety Notes

- Never ask for or use a private key
- Submit transactions only through Base MCP `send_calls`
- Always show quote amounts to the user before building swap transactions
- For large swaps, suggest using the DEX compare endpoint to show routing advantage
- The AKKA API returns unsigned transaction data only — no funds are moved until the user signs

---

## Notes

- Native ETH on Base: `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`
- USDC on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- WETH on Base: `0x4200000000000000000000000000000000000006`
- Token amounts are always in base units (USDC = 1e6, ETH = 1e18)
- Use `chain: "base"` with `send_calls`, not numeric chain ID
- Slippage is a percentage (1 = 1%), not basis points
