import { StellarWalletsKit } from "@creit-tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";

let initialized = false;

function ensureKit() {
  if (!initialized) {
    StellarWalletsKit.init({ modules: defaultModules() });
    initialized = true;
  }
}

// Opens the wallet-selection modal (Freighter, xBull, Albedo, Lobstr, Hana, …)
// and resolves with the chosen wallet's address.
export async function connectWallet() {
  ensureKit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function signWithWallet(xdr, address, networkPassphrase) {
  ensureKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase,
    address,
  });
  return signedTxXdr;
}
