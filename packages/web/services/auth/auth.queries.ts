/**
 * Wallet-address-prefixed query keys (D-001 / wallet-provider convention): a
 * Freighter account switch must invalidate everything, so `address` is always
 * the first key segment.
 */
export const authKeys = {
  all: (address: string | null) => ['auth', address] as const,
  me: (address: string | null) => [...authKeys.all(address), 'me'] as const,
};
