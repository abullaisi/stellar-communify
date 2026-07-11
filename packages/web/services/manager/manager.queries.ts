/** Wallet-address-prefixed query keys — see `services/auth/auth.queries.ts` for the convention. */
export const managerKeys = {
  all: (address: string | null) => ['manager', address] as const,
  isManager: (address: string | null) => [...managerKeys.all(address), 'is-manager'] as const,
  myContent: (address: string | null) => [...managerKeys.all(address), 'my-content'] as const,
  accrued: (address: string | null) => [...managerKeys.all(address), 'accrued'] as const,
};
