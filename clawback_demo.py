import asyncio

from xrpl.models.transactions import AccountSet, Clawback, Payment, TrustSet
from xrpl.models.transactions.account_set import AccountSetAsfFlag

from xrpl_helpers import (
    fund_wallet,
    issued_currency_amount,
    submit_and_log,
    xrpl_client,
)

TOKEN_CODE = "TES"
TOKEN_AMOUNT = "100"
CLAWBACK_PORTION = "50"


async def main() -> None:
    async with xrpl_client() as client:
        issuer = await fund_wallet(client, "issuer")
        receiver = await fund_wallet(client, "receiver")

        await submit_and_log(
            client,
            AccountSet(
                account=issuer.classic_address,
                set_flag=AccountSetAsfFlag.ASF_ALLOW_TRUSTLINE_CLAWBACK,
            ),
            issuer,
            description="Clawback enabled on issuer",
        )

        await submit_and_log(
            client,
            AccountSet(
                account=issuer.classic_address,
                set_flag=AccountSetAsfFlag.ASF_DEFAULT_RIPPLE,
            ),
            issuer,
            description="Default Ripple enabled on issuer",
        )

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
            Clawback(
                account=issuer.classic_address,
                amount=issued_currency_amount(
                    TOKEN_CODE, receiver.classic_address, CLAWBACK_PORTION
                ),
            ),
            issuer,
            description="Clawback transaction submitted",
        )


if __name__ == "__main__":
    asyncio.run(main())
