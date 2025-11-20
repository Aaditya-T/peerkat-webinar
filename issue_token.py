import asyncio
import json
from pathlib import Path

from xrpl.models.transactions import AccountSet, Payment, TrustSet
from xrpl.models.transactions.account_set import AccountSetAsfFlag
from xrpl.models.transactions.trust_set import TrustSetFlag

from xrpl_helpers import (
    fund_wallet,
    issued_currency_amount,
    submit_and_log,
    xrpl_client,
)

TOKEN_CODE = "TES"
TOKEN_AMOUNT = "1000"
TRANSFER_AMOUNT = "100"
WALLETS_PATH = Path("wallets.json")


async def main() -> None:
    async with xrpl_client() as client:
        issuer = await fund_wallet(client, "issuer")
        receiver = await fund_wallet(client, "receiver")
        third = await fund_wallet(client, "third")

        await submit_and_log(
            client,
            AccountSet(
                account=issuer.classic_address,
                set_flag=AccountSetAsfFlag.ASF_DEFAULT_RIPPLE,
            ),
            issuer,
            description="Default Ripple enabled on issuer",
        )

        wallets = [
            {"name": "issuer", "address": issuer.classic_address, "seed": issuer.seed},
            {
                "name": "receiver",
                "address": receiver.classic_address,
                "seed": receiver.seed,
            },
            {"name": "third", "address": third.classic_address, "seed": third.seed},
        ]
        WALLETS_PATH.write_text(json.dumps(wallets, indent=2))
        print(f"Wallets saved to {WALLETS_PATH}")

        await submit_and_log(
            client,
            TrustSet(
                account=receiver.classic_address,
                limit_amount=issued_currency_amount(
                    TOKEN_CODE, issuer.classic_address, TOKEN_AMOUNT
                ),
            ),
            receiver,
            description="Trustline set from receiver to issuer",
        )

        await submit_and_log(
            client,
            Payment(
                account=issuer.classic_address,
                destination=receiver.classic_address,
                amount=issued_currency_amount(
                    TOKEN_CODE, issuer.classic_address, TOKEN_AMOUNT
                ),
            ),
            issuer,
            description="Token issued to receiver",
        )

        await submit_and_log(
            client,
            TrustSet(
                account=third.classic_address,
                limit_amount=issued_currency_amount(
                    TOKEN_CODE, issuer.classic_address, TOKEN_AMOUNT
                ),
                flags=TrustSetFlag.TF_SET_NO_RIPPLE,
            ),
            third,
            description="Trustline set from third to issuer",
        )

        await submit_and_log(
            client,
            Payment(
                account=receiver.classic_address,
                destination=third.classic_address,
                amount=issued_currency_amount(
                    TOKEN_CODE, issuer.classic_address, TRANSFER_AMOUNT
                ),
            ),
            receiver,
            description="Token transferred from receiver to third",
        )


if __name__ == "__main__":
    asyncio.run(main())
