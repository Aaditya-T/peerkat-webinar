const xrpl = require("xrpl");

const TOKEN_CODE = "TES";
const TOKEN_AMOUNT = "100";

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  // 1. Create issuer and receiver wallets
  const issuer = (await client.fundWallet()).wallet;
  const receiver = (await client.fundWallet()).wallet;

  // 2. Enable Require Auth on issuer (must be first!)
  const setRequireAuthTx = {
    TransactionType: "AccountSet",
    Account: issuer.classicAddress,
    SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth
  };
  const requireauth_prepared = await client.autofill(setRequireAuthTx);
  const requireauth_signed = issuer.sign(requireauth_prepared);
  const requireauth_result = await client.submitAndWait(requireauth_signed.tx_blob);
  console.log("Require Auth enabled on issuer:", requireauth_result.result.meta.TransactionResult);

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

  // 4. Set up trustline from receiver to issuer (should be unauthorized)
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
  console.log("Trustline set from receiver to issuer (unauthorized):", ts_result.result.meta.TransactionResult);

  // 5. Issuer tries to send tokens to receiver (should fail)
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
  console.log("Issuer tried to send tokens to receiver (should fail):", pay_result.result.meta.TransactionResult);

  // 6. Issuer authorizes the trustline
  const authorizeTx = {
    TransactionType: "TrustSet",
    Account: issuer.classicAddress,
    LimitAmount: {
      currency: TOKEN_CODE,
      issuer: receiver.classicAddress,
      value: "0",
    },
    Flags: xrpl.TrustSetFlags.tfSetfAuth,
  };
  const auth_prepared = await client.autofill(authorizeTx);
  const auth_signed = issuer.sign(auth_prepared);
  const auth_result = await client.submitAndWait(auth_signed.tx_blob);
  console.log("Issuer authorized receiver's trustline:", auth_result.result.meta.TransactionResult);

  // 7. Issuer sends tokens to receiver (should succeed)
  const pay2_prepared = await client.autofill(paymentTx);
  const pay2_signed = issuer.sign(pay2_prepared);
  const pay2_result = await client.submitAndWait(pay2_signed.tx_blob);
  console.log("Issuer sent tokens to receiver (should succeed):", pay2_result.result.meta.TransactionResult);

  // 8. Issuer unwhitelists (removes authorization) from the trustline
  const unauthTx = {
    TransactionType: "TrustSet",
    Account: issuer.classicAddress,
    LimitAmount: {
      currency: TOKEN_CODE,
      issuer: receiver.classicAddress,
      value: "0",
    },
    Flags: xrpl.TrustSetFlags.tfClearAuth,
  };
  const unauth_prepared = await client.autofill(unauthTx);
  const unauth_signed = issuer.sign(unauth_prepared);
  const unauth_result = await client.submitAndWait(unauth_signed.tx_blob);
  console.log("Issuer removed authorization from receiver's trustline:", unauth_result.result.meta.TransactionResult);

  await client.disconnect();
}

main().catch(console.error); 