# SafeTrade Backend

SafeTrade Backend is a TypeScript-based Express API for SafeTrade, a peer-to-peer escrow service built on the Stellar blockchain. The server currently includes core configuration and contract integration utilities for Stellar/Soroban, plus a health check endpoint.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Stellar & Soroban Integration](#stellar--soroban-integration)
- [Contributing](#contributing)
- [License](#license)

## Features

- Express API scaffold with security middleware
- Health check endpoint for service readiness
- Stellar network configuration via environment variables
- Soroban contract helpers for trade operations and transaction preparation
- Zod-ready schema and typed trade models for future API endpoints

## Project Structure

- `src/index.ts` - Express app setup and HTTP server entrypoint
- `src/config.ts` - application configuration and Stellar network helper
- `src/services/contract.ts` - Stellar/Soroban contract invocation helpers
- `src/types/trade.ts` - trade model and request payload types
- `src/utils/errors.ts` - API error handling helpers

## Prerequisites

- Node.js 20+ (recommended)
- npm or yarn
- Stellar account and contract deployment details for Soroban integration

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/GenesisPray/Safetrade-Backend.git
   cd Safetrade-Backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the project root and define the required environment variables:

```env
PORT=3000
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
CONTRACT_ID=
ADMIN_ADDRESS=
```

- `PORT` - API server port (default `3000`)
- `STELLAR_NETWORK` - Stellar network name (`testnet`, `mainnet`, `public`, `futurenet`, or `standalone`)
- `SOROBAN_RPC_URL` - Soroban RPC endpoint
- `HORIZON_URL` - Horizon endpoint for Stellar account data
- `CONTRACT_ID` - deployed Soroban contract ID
- `ADMIN_ADDRESS` - escrow admin address for dispute resolution

## Available Scripts

- `npm run dev` - start the API in development mode with `tsx watch`
- `npm run build` - compile TypeScript to `dist`
- `npm start` - run the compiled production build

## API Endpoints

### `GET /health`

Returns a simple JSON health check:

- `status` - `ok`
- `service` - `SafeTrade API`
- `version` - current service version
- `network` - configured Stellar network
- `timestamp` - server timestamp

Example response:

```json
{
  "status": "ok",
  "service": "SafeTrade API",
  "version": "0.1.0",
  "network": "testnet",
  "timestamp": "2026-07-15T00:00:00.000Z"
}
```

## Stellar & Soroban Integration

The backend includes contract-level helpers for interacting with Soroban:

- `getTrade` / `getTradeCount`
- `getTradesByBuyer` / `getTradesBySeller`
- `buildCreateTradeTx`
- `buildConfirmReceiptTx`
- `buildCancelTradeTx`
- `buildOpenDisputeTx`
- `buildResolveDisputeTx`

These helper functions prepare transaction XDR payloads and simulate contract calls using the configured Soroban RPC endpoint.

## Contributing

Contributions are welcome. Please open an issue or submit a pull request for enhancements, bug fixes, or new API endpoint support.

## License

This repository does not include a license file. Add a license if required for your project.
