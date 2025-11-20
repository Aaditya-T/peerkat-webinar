import asyncio
import json
from decimal import Decimal
from pathlib import Path
from typing import Dict, List

from xrpl.models.transactions import OfferCreate
from xrpl.utils import xrp_to_drops
from xrpl.wallet import Wallet

from xrpl_helpers import issued_currency_amount, submit_and_log, xrpl_client

TOKEN_CODE = "TES"
SELL_AMOUNT = Decimal("2")
BUY_AMOUNT = Decimal("2")
PRICE_PER_TOKEN_XRP = Decimal("1")
WALLETS_PATH = Path("wallets.json")


def load_wallet(name: str, records: List[Dict[str, str]]) -> Wallet:
    record = next((entry for entry in records if entry["name"] == name), None)
    if record is None:
        raise ValueError(f"Wallet with name '{name}' not found in {WALLETS_PATH}")
    return Wallet.from_seed(record["seed"])


async def main() -> None:
    if not WALLETS_PATH.exists():
        raise FileNotFoundError(
            f"Missing {WALLETS_PATH}. Run issue_token.py to generate funded wallets."
        )

    wallets = json.loads(WALLETS_PATH.read_text())
    issuer = load_wallet("issuer", wallets)
    receiver = load_wallet("receiver", wallets)
    third = load_wallet("third", wallets)
    xrp_total = SELL_AMOUNT * PRICE_PER_TOKEN_XRP

    async with xrpl_client() as client:
        await submit_and_log(
            client,
            OfferCreate(
                account=receiver.classic_address,
                taker_gets=issued_currency_amount(
                    TOKEN_CODE, issuer.classic_address, str(SELL_AMOUNT)
                ),
                taker_pays=xrp_to_drops(str(xrp_total)),
            ),
            receiver,
            description="Receiver placed a sell offer for TES",
        )

        await submit_and_log(
            client,
            OfferCreate(
                account=third.classic_address,
                taker_gets=xrp_to_drops(str(xrp_total)),
                taker_pays=issued_currency_amount(
                    TOKEN_CODE, issuer.classic_address, str(BUY_AMOUNT)
                ),
            ),
            third,
            description="Third placed a buy offer for TES",
        )


if __name__ == "__main__":
    asyncio.run(main())
