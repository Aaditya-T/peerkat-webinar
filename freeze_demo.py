import asyncio

from xrpl.asyncio.transaction import XRPLReliableSubmissionException
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
FREEZE_AMOUNT = "50"


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

        for wallet in (receiver, third):
            await submit_and_log(
                client,
                TrustSet(
                    account=wallet.classic_address,
                    limit_amount=issued_currency_amount(
                        TOKEN_CODE, issuer.classic_address, TOKEN_AMOUNT
                    ),
                ),
                wallet,
                description=f"Trustline set from {wallet.classic_address} to issuer",
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
            Payment(
                account=receiver.classic_address,
                destination=third.classic_address,
                amount=issued_currency_amount(
                    TOKEN_CODE, issuer.classic_address, TRANSFER_AMOUNT
                ),
            ),
            receiver,
            description="Receiver sent tokens to third",
        )

        await submit_and_log(
            client,
            TrustSet(
                account=issuer.classic_address,
                limit_amount=issued_currency_amount(
                    TOKEN_CODE, receiver.classic_address, "0"
                ),
                flags=TrustSetFlag.TF_SET_FREEZE,
            ),
            issuer,
            description="Issuer froze receiver's trust line",
        )

        try:
            await submit_and_log(
                client,
                Payment(
                    account=receiver.classic_address,
                    destination=third.classic_address,
                    amount=issued_currency_amount(
                        TOKEN_CODE, issuer.classic_address, FREEZE_AMOUNT
                    ),
                ),
                receiver,
                description="Receiver attempted to send tokens while frozen",
            )
        except XRPLReliableSubmissionException as exc:
            print(f"Expected failure while frozen: {exc}")

        await submit_and_log(
            client,
            TrustSet(
                account=issuer.classic_address,
                limit_amount=issued_currency_amount(
                    TOKEN_CODE, receiver.classic_address, "0"
                ),
                flags=TrustSetFlag.TF_CLEAR_FREEZE,
            ),
            issuer,
            description="Issuer unfroze receiver's trust line",
        )

        await submit_and_log(
            client,
            Payment(
                account=receiver.classic_address,
                destination=third.classic_address,
                amount=issued_currency_amount(
                    TOKEN_CODE, issuer.classic_address, FREEZE_AMOUNT
                ),
            ),
            receiver,
            description="Receiver sent tokens to third after unfreeze",
        )


if __name__ == "__main__":
    asyncio.run(main())
