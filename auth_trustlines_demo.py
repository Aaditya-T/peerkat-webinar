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
TOKEN_AMOUNT = "100"


async def main() -> None:
    async with xrpl_client() as client:
        issuer = await fund_wallet(client, "issuer")
        receiver = await fund_wallet(client, "receiver")

        await submit_and_log(
            client,
            AccountSet(
                account=issuer.classic_address,
                set_flag=AccountSetAsfFlag.ASF_REQUIRE_AUTH,
            ),
            issuer,
            description="Require Auth enabled on issuer",
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
            description="Trustline set from receiver to issuer (unauthorized)",
        )

        try:
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
                description="Issuer attempted to send tokens before authorization",
            )
        except XRPLReliableSubmissionException as exc:
            print(f"Expected failure before authorization: {exc}")

        await submit_and_log(
            client,
            TrustSet(
                account=issuer.classic_address,
                limit_amount=issued_currency_amount(
                    TOKEN_CODE, receiver.classic_address, "0"
                ),
                flags=TrustSetFlag.TF_SET_AUTH,
            ),
            issuer,
            description="Issuer authorized receiver's trustline",
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
            description="Issuer sent tokens after authorization",
        )

        print(
            "Authorization cannot be revoked once granted; tfClearAuth is not available."
        )


if __name__ == "__main__":
    asyncio.run(main())
