import { Komunify, Usdc } from '@komunify/contract-client';
import { signTransaction as freighterSignTransaction } from '@stellar/freighter-api';

import { getStellarConfig } from './stellar';

/**
 * Contract client factories. Reads simulate over RPC with no wallet (publicKey/
 * signTransaction omitted). Writes pass `publicKey` so the client can build the
 * transaction with the right source account, plus `signTransaction`, which
 * matches Freighter's `signTransaction` signature exactly (`SignTransaction`
 * type in `@stellar/stellar-sdk/contract`) — no adapter needed.
 *
 * `contractId` comes from `NEXT_PUBLIC_KOMUNIFY_CONTRACT_ID` / `_USDC_CONTRACT_ID`.
 * Empty until Lane A deploys; calls will fail (not silently no-op) until then —
 * that failure is the expected state while building against stub bindings.
 */

export function getKomunifyClient(publicKey?: string): Komunify.Client {
  const cfg = getStellarConfig();
  return new Komunify.Client({
    contractId: cfg.komunifyContractId,
    networkPassphrase: cfg.networkPassphrase,
    rpcUrl: cfg.rpcUrl,
    publicKey,
    signTransaction: publicKey ? freighterSignTransaction : undefined,
  });
}

export function getUsdcClient(publicKey?: string): Usdc.Client {
  const cfg = getStellarConfig();
  return new Usdc.Client({
    contractId: cfg.usdcContractId,
    networkPassphrase: cfg.networkPassphrase,
    rpcUrl: cfg.rpcUrl,
    publicKey,
    signTransaction: publicKey ? freighterSignTransaction : undefined,
  });
}

/** USDC has 7 decimals (D-002). Format a base-unit bigint as a display string. */
export function formatTokenAmount(amount: bigint, decimals = 7): string {
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  const sign = negative ? '-' : '';
  return fracStr ? `${sign}${whole}.${fracStr}` : `${sign}${whole}`;
}
