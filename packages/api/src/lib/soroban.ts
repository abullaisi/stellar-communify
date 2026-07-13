import { Komunify, contract, Keypair } from '@komunify/contract-client';
import { getNetworkConfig } from '@komunify/shared';
import { env } from '../config/env.js';

/**
 * Thin read helper around the generated `komunify` contract client. Every entitlement check in
 * this package goes through here. Simulation only — `contract.NULL_ACCOUNT` is used as the
 * source account since reads never sign or submit a transaction. `is_manager` (and everything
 * else) is simulated fresh on every call; nothing here is cached.
 */
function client(): Komunify.Client {
  if (!env.KOMUNIFY_CONTRACT_ID) {
    throw new Error('KOMUNIFY_CONTRACT_ID is not configured');
  }
  const { networkPassphrase } = getNetworkConfig(env.STELLAR_NETWORK);
  return new Komunify.Client({
    contractId: env.KOMUNIFY_CONTRACT_ID,
    networkPassphrase,
    rpcUrl: env.SOROBAN_RPC_URL,
    publicKey: contract.NULL_ACCOUNT,
  });
}

/**
 * A `komunify` client that can sign and submit (not just simulate). Backed by the
 * `SETTLE_SIGNER_SECRET` server keypair; used to batch the permissionless `settle_member`.
 * Returns null when no signer is configured so callers can 503 cleanly.
 */
export function signingClient(): { client: Komunify.Client; address: string } | null {
  if (!env.KOMUNIFY_CONTRACT_ID || !env.SETTLE_SIGNER_SECRET) {
    return null;
  }
  const { networkPassphrase } = getNetworkConfig(env.STELLAR_NETWORK);
  const keypair = Keypair.fromSecret(env.SETTLE_SIGNER_SECRET);
  const signer = contract.basicNodeSigner(keypair, networkPassphrase);
  const client = new Komunify.Client({
    contractId: env.KOMUNIFY_CONTRACT_ID,
    networkPassphrase,
    rpcUrl: env.SOROBAN_RPC_URL,
    publicKey: keypair.publicKey(),
    signTransaction: signer.signTransaction,
  });
  return { client, address: keypair.publicKey() };
}

export async function isManager(address: string): Promise<boolean> {
  const tx = await client().is_manager({ who: address });
  return tx.result;
}

export async function isActive(address: string): Promise<boolean> {
  const tx = await client().is_active({ member: address });
  return tx.result;
}

export async function currentEpoch(): Promise<number> {
  const tx = await client().current_epoch();
  return tx.result;
}

export async function epochEndsAt(epoch: number): Promise<bigint> {
  const tx = await client().epoch_ends_at({ epoch });
  return tx.result;
}

export async function hasRead(epoch: number, contentId: bigint, member: string): Promise<boolean> {
  const tx = await client().has_read({ epoch, content_id: contentId, member });
  return tx.result;
}

export async function getContent(contentId: bigint): Promise<Komunify.Content> {
  const tx = await client().get_content({ content_id: contentId });
  return tx.result;
}

export async function getStats(): Promise<Komunify.Stats> {
  const tx = await client().get_stats();
  return tx.result;
}

export async function getContentReads(epoch: number, contentId: bigint): Promise<number> {
  const tx = await client().get_content_reads({ epoch, content_id: contentId });
  return tx.result;
}

export async function getBudget(epoch: number, member: string): Promise<bigint> {
  const tx = await client().get_budget({ epoch, member });
  return tx.result;
}

export async function getMemberReads(epoch: number, member: string): Promise<number> {
  const tx = await client().get_member_reads({ epoch, member });
  return tx.result;
}
