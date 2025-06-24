const xrpl = require("xrpl");

const TOKEN_CODE = "TES";
const TOKEN_AMOUNT = "100";

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  // 1. Create issuer and receiver wallets
  const issuer = (await client.fundWallet()).wallet;
  const receiver = (await client.fundWallet()).wallet;

  // 2. Enable Allow Trust Line Clawback on issuer (must be first!)
  const setClawbackTx = {
    TransactionType: "AccountSet",
    Account: issuer.classicAddress,
    SetFlag: xrpl.AccountSetAsfFlags.asfAllowTrustLineClawback
  };
  const clawback_prepared = await client.autofill(setClawbackTx);
  const clawback_signed = issuer.sign(clawback_prepared);
  const clawback_result = await client.submitAndWait(clawback_signed.tx_blob);
  console.log("Clawback enabled on issuer:", clawback_result.result.meta.TransactionResult);

  // 3. Set Default Ripple on issuer
  const setDefaultRippleTx = {
    TransactionType: "AccountSet",
    Account: issuer.classicAddress,
    SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple
  };
  const set_prepared = await client.autofill(setDefaultRippleTx);
  const set_signed = issuer.sign(set_prepared);
  const set_result = await client.submitAndWait(set_signed.tx_blob);
  console.log("Default Ripple enabled on issuer:", set_result.result.meta.TransactionResult);

  // 4. Set up trustline from receiver to issuer
  const trustSetTx = {
    TransactionType: "TrustSet",
    Account: receiver.classicAddress,
    LimitAmount: {
      currency: TOKEN_CODE,
      issuer: issuer.classicAddress,
      value: TOKEN_AMOUNT,
    },
  };
  const ts_prepared = await client.autofill(trustSetTx);
  const ts_signed = receiver.sign(ts_prepared);
  const ts_result = await client.submitAndWait(ts_signed.tx_blob);
  console.log("Trustline set from receiver to issuer:", ts_result.result.meta.TransactionResult);

  // 5. Issue token from issuer to receiver
  const paymentTx = {
    TransactionType: "Payment",
    Account: issuer.classicAddress,
    Amount: {
      currency: TOKEN_CODE,
      value: TOKEN_AMOUNT,
      issuer: issuer.classicAddress,
    },
    Destination: receiver.classicAddress,
  };
  const pay_prepared = await client.autofill(paymentTx);
  const pay_signed = issuer.sign(pay_prepared);
  const pay_result = await client.submitAndWait(pay_signed.tx_blob);
  console.log("Token issued to receiver:", pay_result.result.meta.TransactionResult);

  // 6. Clawback tokens from receiver back to issuer
  const clawbackTx = {
    TransactionType: "Clawback",
    Account: issuer.classicAddress,
    Amount: {
      currency: TOKEN_CODE,
      value: (TOKEN_AMOUNT - 50).toString(),
      issuer: receiver.classicAddress,
    }
  };
  const cb_prepared = await client.autofill(clawbackTx);
  const cb_signed = issuer.sign(cb_prepared);
  const cb_result = await client.submitAndWait(cb_signed.tx_blob);
  console.log("Clawback transaction result:", cb_result.result.meta.TransactionResult);

  await client.disconnect();
}

main().catch(console.error); 