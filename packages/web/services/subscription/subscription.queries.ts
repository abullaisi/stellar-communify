/** Wallet-address-prefixed query keys — see `services/auth/auth.queries.ts` for the convention. */
export const subscriptionKeys = {
  all: (address: string | null) => ['subscription', address] as const,
  status: (address: string | null) => [...subscriptionKeys.all(address), 'status'] as const,
  price: (address: string | null) => [...subscriptionKeys.all(address), 'price'] as const,
  usdcBalance: (address: string | null) => [...subscriptionKeys.all(address), 'usdc-balance'] as const,
  faucetAvailableAt: (address: string | null) =>
    [...subscriptionKeys.all(address), 'faucet-available-at'] as const,
};
