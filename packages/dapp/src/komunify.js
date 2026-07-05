import { contract } from "@stellar/stellar-sdk";
import { signWithWallet } from "./wallet";
import { TESTNET_PASSPHRASE } from "./stellar";

// Komunify subscription + split contract, deployed 2026-07-05
export const CONTRACT_ID =
  "CCJNKBUQAA7SAANVGJF4WFF4UFXMPCDDZACD5ERHILUHBWEROQZ2BQVC";

const RPC_URL = "https://soroban-testnet.stellar.org";

const STROOPS = 10_000_000n;

const clients = new Map();

// contract.Client fetches the contract spec straight from the chain, so the
// frontend needs no generated bindings package. Same mechanism `stellar
// contract bindings typescript` wraps, minus the codegen step.
async function getClient(publicKey) {
  const key = publicKey || "readonly";
  if (!clients.has(key)) {
    clients.set(
      key,
      contract.Client.from({
        contractId: CONTRACT_ID,
        networkPassphrase: TESTNET_PASSPHRASE,
        rpcUrl: RPC_URL,
        publicKey: publicKey || undefined,
        signTransaction: publicKey
          ? async (xdr) => ({
              signedTxXdr: await signWithWallet(
                xdr,
                publicKey,
                TESTNET_PASSPHRASE
              ),
              signerAddress: publicKey,
            })
          : undefined,
      })
    );
  }
  return clients.get(key);
}

// Live dashboard reads: count, volume, split config. View calls, no signing.
export async function getStats() {
  const client = await getClient(null);
  const [count, volume, config] = await Promise.all([
    client.get_count(),
    client.get_volume(),
    client.get_config(),
  ]);
  return {
    count: Number(count.result),
    volumeXlm: Number(volume.result) / Number(STROOPS),
    config: config.result,
  };
}

// One payment in, three transfers out. Returns the transaction hash.
export async function subscribe(address, xlmAmount) {
  const client = await getClient(address);
  const amount = BigInt(Math.round(Number(xlmAmount) * Number(STROOPS)));
  const tx = await client.subscribe({ member: address, amount });
  const sent = await tx.signAndSend();
  return (
    sent.sendTransactionResponse?.hash ||
    sent.getTransactionResponse?.txHash ||
    ""
  );
}

// The three error states Level 2 asks for, plus the contract's own guards.
export function classifyError(err) {
  const msg = String(err?.message || err || "");
  if (/no wallet|not installed|no module|modal closed|closed by user/i.test(msg))
    return "No Stellar wallet found. Install Freighter (or xBull/Albedo) and set it to Testnet.";
  if (/reject|denied|declined|cancel/i.test(msg))
    return "You rejected the signature request in your wallet.";
  if (/#3\b|AmountTooLow/i.test(msg))
    return "Minimum subscription is 1 XLM.";
  if (/balance|underfunded|insufficient|#10\b/i.test(msg))
    return "Insufficient XLM balance to cover this subscription.";
  return msg || "Transaction failed";
}

export function explorerContractUrl() {
  return `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`;
}
