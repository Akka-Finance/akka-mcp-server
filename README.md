# @akka-finance/mcp-server

MCP server for the [AKKA Finance](https://akka.finance) DEX aggregator — swap quotes, routes, and execution across EVM chains.

[![npm version](https://img.shields.io/npm/v/@akka-finance/mcp-server)](https://www.npmjs.com/package/@akka-finance/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<a href="https://glama.ai/mcp/servers"><img width="380" height="200" alt="AKKA Finance MCP server" src="https://glama.ai/mcp/servers/badge" /></a>

## Install

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "akka-dex": {
      "command": "npx",
      "args": ["-y", "@akka-finance/mcp-server"],
      "env": {
        "AKKA_API_BASE": "https://api.akka.finance"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add akka-dex -- npx -y @akka-finance/mcp-server
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "akka-dex": {
      "command": "npx",
      "args": ["-y", "@akka-finance/mcp-server"]
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "akka-dex": {
      "command": "npx",
      "args": ["-y", "@akka-finance/mcp-server"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `akka_get_quote` | Get the best swap quote across 25+ DEXes |
| `akka_get_swap` | Build an unsigned swap transaction |
| `akka_dex_compare` | Compare quotes across individual DEX pools |
| `akka_get_spender` | Get the router contract address for token approval |
| `akka_get_approve_tx` | Build an ERC-20 approve transaction |
| `akka_check_allowance` | Check current token spending allowance |
| `akka_list_tokens` | List tradeable tokens on a chain |
| `akka_get_token` | Get token details by address |
| `akka_list_chains` | List all supported chains |

## Supported Chains

| Chain ID | Network | Native Token |
|----------|---------|-------------|
| 999 | HyperEVM (Hyperliquid) | HYPE |
| 1116 | Core | CORE |
| 50 | XDC Network | XDC |
| 223 | B2 Network | BTC |
| 200901 | Bitlayer | BTC |
| 4200 | Merlin | BTC |
| 60808 | BOB | ETH |

## Configuration

Configuration via environment variables or CLI arguments:

| Env Variable | CLI Arg | Default | Description |
|-------------|---------|---------|-------------|
| `AKKA_API_BASE` | `--api-base` | `https://api.akka.finance` | AKKA API base URL |
| `AKKA_API_KEY` | `--api-key` | — | API key (if required) |
| `AKKA_MCP_TRANSPORT` | `--transport` | `stdio` | Transport: `stdio` or `http` |
| `AKKA_MCP_PORT` | `--port` | `3100` | Port for HTTP transport |
| `AKKA_TIMEOUT` | `--timeout` | `15000` | Request timeout in ms |

### HTTP Transport

For remote/web-based agents:

```bash
npx @akka-finance/mcp-server --transport=http --port=3100
```

Exposes a Streamable HTTP endpoint at `http://localhost:3100/mcp`.

## Base MCP Skill Plugin

A Base MCP skill plugin for token swaps on Base is included at [`skills/akka-swap.md`](skills/akka-swap.md). Drop it into your Base MCP skills directory to enable AKKA-powered swaps through Base's smart wallet flow.

## Development

```bash
git clone https://github.com/Akka-Finance/akka-mcp-server.git
cd akka-mcp-server
npm install
npm run dev        # Run with tsx (hot reload)
npm run build      # Compile TypeScript
npm start          # Run compiled output
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## How It Works

This MCP server is a thin client that calls the [AKKA Finance REST API](https://api.akka.finance/docs). It does not hold private keys or execute transactions. All swap/approve tools return **unsigned transaction data** that the user must sign and broadcast separately.

```
AI Agent (Claude, Cursor, etc.)
  ↕ MCP Protocol (stdio or HTTP)
AKKA MCP Server (this package)
  ↕ HTTP REST
AKKA Finance API
  ↕ On-chain
25+ DEXes across 7 EVM chains
```

## License

MIT
