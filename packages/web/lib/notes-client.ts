import { Client } from '@komunify/contract-client';
import { signTransaction } from '@stellar/freighter-api';
import { getStellarConfig } from './stellar';

/**
 * Build a notes contract client bound to Freighter for signing.
 *
 * - Read-only calls (`list_notes`, `get_note`) work without a `publicKey` — just
 *   `await client.list_notes({ owner }).then(t => t.result)`.
 * - State-changing calls (`add_note`, `update_note`, `delete_note`) need `publicKey`
 *   set; call `await tx.signAndSend()` and Freighter prompts the user to sign.
 */
export function getNotesClient(publicKey?: string): Client {
  const cfg = getStellarConfig();
  if (!cfg.contractId) {
    throw new Error(
      'NEXT_PUBLIC_NOTES_CONTRACT_ID is not set — deploy the contract (make deploy) and set it in .env.local',
    );
  }

  return new Client({
    contractId: cfg.contractId,
    networkPassphrase: cfg.networkPassphrase,
    rpcUrl: cfg.rpcUrl,
    allowHttp: cfg.rpcUrl.startsWith('http://'),
    publicKey,
    signTransaction: async (xdr, opts) => {
      const res = await signTransaction(xdr, {
        networkPassphrase: cfg.networkPassphrase,
        address: opts?.address,
      });
      if (res.error) {
        throw new Error(res.error.message || 'Failed to sign transaction');
      }
      return { signedTxXdr: res.signedTxXdr, signerAddress: res.signerAddress };
    },
  });
}
