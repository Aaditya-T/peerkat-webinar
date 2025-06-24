const xrpl = require("xrpl");

const TOKEN_CODE = "TES";
const TOKEN_AMOUNT = "1000";
const TRANSFER_AMOUNT = "100";
const FREEZE_AMOUNT = "50";

async function main() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  // 1. Create 3 funded wallets
  const issuer = (await client.fundWallet()).wallet;
  const receiver = (await client.fundWallet()).wallet;
  const third = (await client.fundWallet()).wallet;

  // 2. Set Default Ripple on issuer
  const setDefaultRippleTx = {
    TransactionType: "AccountSet",
    Account: issuer.classicAddress,
    SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple
  };
  const set_prepared = await client.autofill(setDefaultRippleTx);
  const set_signed = issuer.sign(set_prepared);
  const set_result = await client.submitAndWait(set_signed.tx_blob);
  console.log("Default Ripple enabled on issuer:", set_result.result.meta.TransactionResult);

  // 3. Set up trustlines from receiver and third to issuer
  for (const wallet of [receiver, third]) {
    const trustSetTx = {
      TransactionType: "TrustSet",
      Account: wallet.classicAddress,
      LimitAmount: {
        currency: TOKEN_CODE,
        issuer: issuer.classicAddress,
        value: TOKEN_AMOUNT,
      },
    };
    const ts_prepared = await client.autofill(trustSetTx);
    const ts_signed = wallet.sign(ts_prepared);
    const ts_result = await client.submitAndWait(ts_signed.tx_blob);
    console.log(`Trustline set from ${wallet.classicAddress} to issuer:`, ts_result.result.meta.TransactionResult);
  }

  // 4. Issue tokens to receiver
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

  // 5. Receiver sends some tokens to third
  const transferTx = {
    TransactionType: "Payment",
    Account: receiver.classicAddress,
    Amount: {
      currency: TOKEN_CODE,
      value: TRANSFER_AMOUNT,
      issuer: issuer.classicAddress,
    },
    Destination: third.classicAddress,
  };
  const transfer_prepared = await client.autofill(transferTx);
  const transfer_signed = receiver.sign(transfer_prepared);
  const transfer_result = await client.submitAndWait(transfer_signed.tx_blob);
  console.log("Receiver sent tokens to third:", transfer_result.result.meta.TransactionResult);

  // 6. Issuer freezes receiver's trust line
  const freezeTx = {
    TransactionType: "TrustSet",
    Account: issuer.classicAddress,
    LimitAmount: {
      currency: TOKEN_CODE,
      issuer: receiver.classicAddress,
      value: "0",
      // value is 0 for freeze, but the important part is the flag
    },
    Flags: xrpl.TrustSetFlags.tfSetFreeze,
    // Peer is receiver
    // This is a TrustSet from issuer to receiver for the token
  };
  const freeze_prepared = await client.autofill(freezeTx);
  const freeze_signed = issuer.sign(freeze_prepared);
  const freeze_result = await client.submitAndWait(freeze_signed.tx_blob);
  console.log("Issuer froze receiver's trust line:", freeze_result.result.meta.TransactionResult);

  // 7. Receiver tries to send tokens to third (should fail)
  const failTx = {
    TransactionType: "Payment",
    Account: receiver.classicAddress,
    Amount: {
      currency: TOKEN_CODE,
      value: FREEZE_AMOUNT,
      issuer: issuer.classicAddress,
    },
    Destination: third.classicAddress,
  };
  const fail_prepared = await client.autofill(failTx);
  const fail_signed = receiver.sign(fail_prepared);
  const fail_result = await client.submitAndWait(fail_signed.tx_blob);
  console.log("Receiver tried to send tokens to third (should fail):", fail_result.result.meta.TransactionResult);

  // 8. Issuer unfreezes receiver's trust line
  const unfreezeTx = {
    TransactionType: "TrustSet",
    Account: issuer.classicAddress,
    LimitAmount: {
      currency: TOKEN_CODE,
      issuer: receiver.classicAddress,
      value: "0",
    },
    Flags: xrpl.TrustSetFlags.tfClearFreeze,
  };
  const unfreeze_prepared = await client.autofill(unfreezeTx);
  const unfreeze_signed = issuer.sign(unfreeze_prepared);
  const unfreeze_result = await client.submitAndWait(unfreeze_signed.tx_blob);
  console.log("Issuer unfroze receiver's trust line:", unfreeze_result.result.meta.TransactionResult);

  // 9. Receiver sends tokens to third again (should succeed)
  const succeedTx = {
    TransactionType: "Payment",
    Account: receiver.classicAddress,
    Amount: {
      currency: TOKEN_CODE,
      value: FREEZE_AMOUNT,
      issuer: issuer.classicAddress,
    },
    Destination: third.classicAddress,
  };
  const succeed_prepared = await client.autofill(succeedTx);
  const succeed_signed = receiver.sign(succeed_prepared);
  const succeed_result = await client.submitAndWait(succeed_signed.tx_blob);
  console.log("Receiver sent tokens to third after unfreeze:", succeed_result.result.meta.TransactionResult);

  await client.disconnect();
}

main().catch(console.error); 