const xrpl = require("xrpl");
const fs = require("fs");

const TOKEN_CODE = "TES";
const SELL_AMOUNT = "2"; 
const BUY_AMOUNT = "2"; 
const PRICE_PER_TOKEN_XRP = "1"; 

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  // Load wallets
  const wallets = JSON.parse(fs.readFileSync("wallets.json"));
  const issuer = xrpl.Wallet.fromSeed(wallets.find(w => w.name === "issuer").seed);
  const receiver = xrpl.Wallet.fromSeed(wallets.find(w => w.name === "receiver").seed);
  const third = xrpl.Wallet.fromSeed(wallets.find(w => w.name === "third").seed);

  // 1. Receiver places a sell offer (sell 50 TES for XRP)
  const sellOfferTx = {
    TransactionType: "OfferCreate",
    Account: receiver.classicAddress,
    TakerGets: {
      currency: TOKEN_CODE,
      issuer: issuer.classicAddress,
      value: SELL_AMOUNT,
    },
    TakerPays: xrpl.xrpToDrops((parseFloat(SELL_AMOUNT) * parseFloat(PRICE_PER_TOKEN_XRP)).toString()),
  };
  const sell_prepared = await client.autofill(sellOfferTx);
  const sell_signed = receiver.sign(sell_prepared);
  const sell_result = await client.submitAndWait(sell_signed.tx_blob);
  console.log("Sell offer placed by receiver:", sell_result.result.meta.TransactionResult);

  // 2. Third places a buy offer (buy 50 TES for XRP)
  const buyOfferTx = {
    TransactionType: "OfferCreate",
    Account: third.classicAddress,
    TakerGets: xrpl.xrpToDrops((parseFloat(BUY_AMOUNT) * parseFloat(PRICE_PER_TOKEN_XRP)).toString()),
    TakerPays: {
      currency: TOKEN_CODE,
      issuer: issuer.classicAddress,
      value: BUY_AMOUNT,
    },
  };
  const buy_prepared = await client.autofill(buyOfferTx);
  const buy_signed = third.sign(buy_prepared);
  const buy_result = await client.submitAndWait(buy_signed.tx_blob);
  console.log("Buy offer placed by third:", buy_result.result.meta.TransactionResult);

  await client.disconnect();
}

main().catch(console.error);
