import { Komunify, contract } from '@komunify/contract-client';
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
