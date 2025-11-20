import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator

from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.asyncio.transaction import submit_and_wait
from xrpl.models.transactions import Transaction
from xrpl.wallet import Wallet
from xrpl.asyncio.wallet import generate_faucet_wallet

TESTNET_URL = "wss://s.altnet.rippletest.net:51233"


@asynccontextmanager
async def xrpl_client(url: str = TESTNET_URL) -> AsyncIterator[AsyncWebsocketClient]:
    client = AsyncWebsocketClient(url)
    await client.open()
    try:
        yield client
    finally:
        await client.close()


async def fund_wallet(client: AsyncWebsocketClient, label: str) -> Wallet:
    wallet = await generate_faucet_wallet(client)
    print(f"Funded {label}: {wallet.classic_address}")
    return wallet


async def submit_and_log(
    client: AsyncWebsocketClient,
    transaction: Transaction,
    wallet: Wallet,
    *,
    description: str,
):
    response = await submit_and_wait(transaction, client, wallet=wallet)
    result = response.result["meta"]["TransactionResult"]
    print(f"{description}: {result}")
    return response
