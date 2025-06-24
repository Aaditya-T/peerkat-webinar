# Peerkat XRPL Workshop

This project demonstrates key features of the XRP Ledger (XRPL) using the `xrpl.js` library and the XRPL Testnet. It is designed for educational workshops and covers:

- **Issuing a custom token on the XRPL**
- **Transferring tokens between accounts**
- **Trading the token on the XRPL Decentralized Exchange (DEX)**

## Prerequisites

- [Node.js](https://nodejs.org/) installed
- Internet connection (to access the XRPL Testnet)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Review the scripts:
   - `issue_token.js`: Issues a token and transfers it between accounts
   - `trade_on_dex.js`: Trades the token on the DEX

## Usage

### 1. Issue a Token and Transfer

This script will:
- Create three funded wallets on the XRPL Testnet
- Set up trustlines
- Issue a custom token from one wallet to another
- Transfer some tokens to a third wallet
- Save all wallet info to `wallets.json`

Run:
```bash
node issue_token.js
```

### 2. Trade the Token on the DEX

This script will:
- Load wallets from `wallets.json`
- Place a sell offer (token for XRP) from the receiver wallet
- Place a buy offer (XRP for token) from the third wallet

Run:
```bash
node trade_on_dex.js
```

## Files

- `issue_token.js` — Token issuance, trustlines, and transfer
- `trade_on_dex.js` — DEX trading example
- `wallets.json` — Stores wallet addresses and seeds for reuse

## Notes

- All operations use the XRPL Testnet. **Do not use mainnet credentials.**
- The scripts are for educational/demo purposes only.
- You can modify the token code, amounts, or add more features as needed.

## Resources
- [XRPL.org Tutorials](https://xrpl.org/docs/tutorials/)
- [xrpl.js Documentation](https://js.xrpl.org/) # peerkat-webinar
