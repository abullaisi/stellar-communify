import {
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";

export const TESTNET_PASSPHRASE = Networks.TESTNET;

export const server = new Horizon.Server(HORIZON_URL);

export async function fetchBalance(address) {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return { funded: true, xlm: native ? native.balance : "0" };
  } catch (err) {
    // Unfunded accounts don't exist on the ledger yet — Horizon returns 404
    if (err?.response?.status === 404 || err?.name === "NotFoundError") {
      return { funded: false, xlm: "0" };
    }
    throw err;
  }
}

export async function fundWithFriendbot(address) {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`
  );
  if (!res.ok) {
    throw new Error(`Friendbot funding failed (HTTP ${res.status})`);
  }
  return res.json();
}

export async function buildPaymentXdr(source, destination, amount) {
  const account = await server.loadAccount(source);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      })
    )
    .setTimeout(120)
    .build();
  return tx.toXDR();
}

export async function submitSignedXdr(signedXdr) {
  const tx = TransactionBuilder.fromXDR(signedXdr, TESTNET_PASSPHRASE);
  return server.submitTransaction(tx);
}

export function explorerTxUrl(hash) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}
