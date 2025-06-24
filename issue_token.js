const xrpl = require("xrpl");
const fs = require("fs");

const TOKEN_CODE = "TES"; 
const TOKEN_AMOUNT = "1000"; 
const TRANSFER_AMOUNT = "100";

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  console.log("Connecting to XRPL Testnet...");
  await client.connect();
  console.log("Connected to XRPL Testnet");

  // 1. Create 3 funded wallets
  const wallet1 = (await client.fundWallet()).wallet; // Issuer
  const wallet2 = (await client.fundWallet()).wallet; // Receiver
  const wallet3 = (await client.fundWallet()).wallet; // Third

  // Set Default Ripple on issuer (wallet1)
  const setDefaultRippleTx = {
    TransactionType: "AccountSet",
    Account: wallet1.classicAddress,
    SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple
  };
  const set_prepared = await client.autofill(setDefaultRippleTx);
  const set_signed = wallet1.sign(set_prepared);
  const set_result = await client.submitAndWait(set_signed.tx_blob);
  console.log("Default Ripple enabled on issuer:", set_result.result.meta.TransactionResult);

  // Save wallets to file
  const wallets = [
    { name: "issuer", address: wallet1.classicAddress, seed: wallet1.seed },
    { name: "receiver", address: wallet2.classicAddress, seed: wallet2.seed },
    { name: "third", address: wallet3.classicAddress, seed: wallet3.seed },
  ];
  fs.writeFileSync("wallets.json", JSON.stringify(wallets, null, 2));
  console.log("Wallets saved to wallets.json");

  // 2. Set up trustline from receiver to issuer
  const trustSetTx = {
    TransactionType: "TrustSet",
    Account: wallet2.classicAddress,
    LimitAmount: {
      currency: TOKEN_CODE,
      issuer: wallet1.classicAddress,
      value: TOKEN_AMOUNT,
    },
  };
  const ts_prepared = await client.autofill(trustSetTx);
  const ts_signed = wallet2.sign(ts_prepared);
  const ts_result = await client.submitAndWait(ts_signed.tx_blob);
  console.log("Trustline set from receiver to issuer:", ts_result.result.meta.TransactionResult);

  // 3. Issue token from issuer to receiver
  const paymentTx = {
    TransactionType: "Payment",
    Account: wallet1.classicAddress,
    Amount: {
      currency: TOKEN_CODE,
      value: TOKEN_AMOUNT,
      issuer: wallet1.classicAddress,
    },
    Destination: wallet2.classicAddress,
  };
  const pay_prepared = await client.autofill(paymentTx);
  const pay_signed = wallet1.sign(pay_prepared);
  const pay_result = await client.submitAndWait(pay_signed.tx_blob);
  console.log("Token issued to receiver:", pay_result.result.meta.TransactionResult);

  // 4. Set up trustline from third to issuer
  const trustSetTx3 = {
    TransactionType: "TrustSet",
    Account: wallet3.classicAddress,
    LimitAmount: {
      currency: TOKEN_CODE,
      issuer: wallet1.classicAddress,
      value: TOKEN_AMOUNT,
    },
    Flags: xrpl.TrustSetFlags.tfSetNoRipple
  };
  const ts3_prepared = await client.autofill(trustSetTx3);
  const ts3_signed = wallet3.sign(ts3_prepared);
  const ts3_result = await client.submitAndWait(ts3_signed.tx_blob);
  console.log("Trustline set from third to issuer:", ts3_result.result.meta.TransactionResult);

  // 5. Transfer token from receiver to third
  const transferTx = {
    TransactionType: "Payment",
    Account: wallet2.classicAddress,
    Amount: {
      currency: TOKEN_CODE,
      value: TRANSFER_AMOUNT,
      issuer: wallet1.classicAddress,
    },
    Destination: wallet3.classicAddress,
  };
  const transfer_prepared = await client.autofill(transferTx);
  const transfer_signed = wallet2.sign(transfer_prepared);
  const transfer_result = await client.submitAndWait(transfer_signed.tx_blob);
  console.log("Token transferred to third:", transfer_result.result.meta.TransactionResult);

  await client.disconnect();
}

main().catch(console.error);
