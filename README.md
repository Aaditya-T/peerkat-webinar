# Peerkat XRPL Workshop

This project demonstrates key features of the XRP Ledger (XRPL) using the `xrpl.js` library and the XRPL Testnet. It is designed for educational workshops and covers:

- **Issuing a custom token on the XRPL**
- **Transferring tokens between accounts**
- **Trading the token on the XRPL Decentralized Exchange (DEX)**
- **Advanced token management features: Clawback, Freezing, and Authorized Trust Lines**

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
   - `clawback_demo.js`: Demonstrates the clawback feature
   - `freeze_demo.js`: Demonstrates freezing and unfreezing a trust line
   - `auth_trustlines_demo.js`: Demonstrates authorized trust lines (whitelisting)

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
- Print balances after trading

Run:
```bash
node trade_on_dex.js
```

## Advanced Token Management Demos

### 3. Clawback Demo
Demonstrates the [Clawback](https://xrpl.org/docs/concepts/tokens/fungible-tokens/clawing-back-tokens/) feature (if supported by the Testnet):
- Enables clawback on the issuer account
- Issues tokens to a receiver
- Claws back the tokens from the receiver back to the issuer

Run:
```bash
node clawback_demo.js
```

### 4. Freeze/Unfreeze Trust Line Demo
Demonstrates [freezing and unfreezing a trust line](https://xrpl.org/docs/tutorials/tasks/use-tokens/freeze-a-trust-line/):
- Issuer, receiver, and third account setup
- Receiver receives tokens and sends some to third
- Issuer freezes receiver's trust line
- Receiver tries to send tokens to third (should fail)
- Issuer unfreezes trust line
- Receiver sends tokens to third again (should succeed)

Run:
```bash
node freeze_demo.js
```

### 5. Authorized Trust Lines Demo
Demonstrates [authorized trust lines](https://xrpl.org/docs/concepts/tokens/fungible-tokens/authorized-trust-lines/):
- Issuer enables Require Auth
- Receiver creates a trust line (initially unauthorized)
- Issuer tries to send tokens (should fail)
- Issuer authorizes (whitelists) the trust line
- Issuer sends tokens (should succeed)
- Issuer removes authorization (unwhitelists)

Run:
```bash
node auth_trustlines_demo.js
```

## Files

- `issue_token.js` — Token issuance, trustlines, and transfer
- `trade_on_dex.js` — DEX trading example
- `clawback_demo.js` — Clawback feature demo
- `freeze_demo.js` — Freeze/unfreeze trust line demo
- `auth_trustlines_demo.js` — Authorized trust lines demo
- `wallets.json` — Stores wallet addresses and seeds for reuse (used by some scripts)

## Notes

- All operations use the XRPL Testnet. **Do not use mainnet credentials.**
- The scripts are for educational/demo purposes only.
- You can modify the token code, amounts, or add more features as needed.
- Some features (like Clawback) require specific amendments to be enabled on the Testnet and may not work if not supported.

## Resources
- [XRPL.org Tutorials](https://xrpl.org/docs/tutorials/)
- [xrpl.js Documentation](https://js.xrpl.org/)