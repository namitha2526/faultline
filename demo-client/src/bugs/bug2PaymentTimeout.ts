import { Faultline } from "../faultline";

// Path A: Card payment timeout
function awaitGatewayReceipt(txnId: string): void {
  throw new Error(`Payment timeout: Card payment gateway timed out after 30000ms waiting for charge confirmation on txn ${txnId}`);
}

function dispatchStripeGatewayRequest(payload: any): void {
  awaitGatewayReceipt(payload.txnId);
}

function processCardTransaction(cardDetails: any): void {
  const txnId = `card_txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  dispatchStripeGatewayRequest({ txnId, amount: 149.99, ...cardDetails });
}

export function triggerCardPaymentTimeout(): void {
  try {
    processCardTransaction({ cardBrand: "Visa", last4: "4242" });
  } catch (err) {
    Faultline.captureException(err, { source: "Card Payment Gateway" });
    throw err;
  }
}

// Path B: UPI payment timeout
function awaitVpaAuthorization(vpaHandle: string): void {
  throw new Error(`Payment timeout: UPI payment authorization timed out after 30000ms while polling VPA status for ${vpaHandle}`);
}

function pollUpiVpaResolution(vpaPayload: any): void {
  awaitVpaAuthorization(vpaPayload.vpa);
}

function initiateUpiTransfer(upiDetails: any): void {
  pollUpiVpaResolution({ vpa: upiDetails.vpa, merchantId: "mch_faultline_01" });
}

export function triggerUpiPaymentTimeout(): void {
  try {
    const userSuffix = Math.floor(Math.random() * 900) + 100;
    initiateUpiTransfer({ vpa: `demo.user${userSuffix}@okhdfcbank` });
  } catch (err) {
    Faultline.captureException(err, { source: "UPI Payment Provider" });
    throw err;
  }
}

// Path C: Wallet payment timeout
function resolveWalletSettlement(walletRef: string): void {
  throw new Error(`Payment timeout: Digital wallet settlement timed out after 30000ms during provider handshake for ref ${walletRef}`);
}

function queryDigitalWalletProvider(walletId: string): void {
  resolveWalletSettlement(`wlt_ref_${walletId}_ack`);
}

function executeWalletDebit(walletPayload: any): void {
  queryDigitalWalletProvider(walletPayload.walletId);
}

export function triggerWalletPaymentTimeout(): void {
  try {
    const wId = `wallet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    executeWalletDebit({ walletId: wId });
  } catch (err) {
    Faultline.captureException(err, { source: "Digital Wallet Payment" });
    throw err;
  }
}

