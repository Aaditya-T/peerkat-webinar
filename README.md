# Peerkat XRPL Workshop (Python)

These demos now use [`xrpl-py`](https://xrpl-py.readthedocs.io/en/stable/) along with the XRPL Testnet to walk through common token scenarios lifted from the authoritative documentation on [xrpl.org](https://xrpl.org). They cover:

- Issuing and transferring a custom fungible token
- Creating buy/sell offers on the on-ledger DEX
- Advanced token controls: [clawback](https://xrpl.org/docs/concepts/tokens/fungible-tokens/clawing-back-tokens/), [trust-line freezing](https://xrpl.org/docs/tutorials/tasks/use-tokens/freeze-a-trust-line/), and [authorized trust lines](https://xrpl.org/docs/concepts/tokens/fungible-tokens/authorized-trust-lines/)

## Prerequisites

- Python 3.10+ with `pip`
- Internet connectivity to access the XRPL Testnet websocket endpoint

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Every script is asynchronous; run them with `python3 <script_name>.py` after activating the virtual environment.

## Scripts

### 1. `issue_token.py`
Implements the basic flow documented in [Issuing Tokens](https://xrpl.org/docs/tutorials/use-tokens/issue-a-fungible-token/):
- funds issuer/receiver/third wallets via the Testnet faucet,
- enables `DefaultRipple` on the issuer,
- establishes trust lines,
- issues `TES` tokens, transfers part of the supply,
- persists wallet seeds to `wallets.json` for later demos.

```bash
python3 issue_token.py
```

### 2. `trade_on_dex.py`
Assuming `wallets.json` exists, recreates wallets with `Wallet.from_seed`, then:
- places a sell offer from the receiver (token → XRP),
- places a matching buy offer from the third wallet (XRP → token),
mirroring the flow from the [DEX overview](https://xrpl.org/docs/concepts/decentralized-exchange/).

```bash
python3 trade_on_dex.py
```

### 3. `clawback_demo.py`
Demonstrates the [Clawback amendment behavior](https://xrpl.org/docs/concepts/tokens/fungible-tokens/clawing-back-tokens/):
- enables `AllowTrustLineClawback`,
- issues tokens,
- submits a `Clawback` transaction to reclaim part of the receiver’s balance.

```bash
python3 clawback_demo.py
```

### 4. `freeze_demo.py`
Follows the trust-line freeze tutorial from xrpl.org:
- sets `DefaultRipple`,
- creates trust lines for receiver and third wallets,
- issues and distributes tokens,
- freezes the receiver’s trust line (expecting a failed payment while frozen),
- unfreezes and retries the payment successfully.

```bash
python3 freeze_demo.py
```

### 5. `auth_trustlines_demo.py`
Implements the [Authorized Trust Lines guide](https://xrpl.org/docs/concepts/tokens/fungible-tokens/authorized-trust-lines/):
- enables `RequireAuth` before any trust lines exist,
- shows that payments fail while the line is unauthorized,
- authorizes the receiver with `tfSetAuth`,
- completes a successful payment afterwards.

> **Note:** `tfClearAuth` does not exist on XRPL. Once a line is authorized it cannot be explicitly “un-whitelisted”; the script prints this reminder.

## Supporting Module

- `xrpl_helpers.py` centralizes websocket client management, faucet funding, amount helpers, and reliable submission logging shared by all scripts.

## Notes

- `wallets.json` is git-ignored and contains **Testnet** seeds only. Do not reuse on Mainnet.
- XRPL Testnet is public—expect occasional ledger delays or amendment testing.
- Feel free to adjust currency codes, amounts, or extend the flows for workshops.

## References

- [xrpl.org documentation](https://xrpl.org) – canonical guides for every feature demonstrated here.
- [`xrpl-py` docs](https://xrpl-py.readthedocs.io/en/stable/) – library API reference.