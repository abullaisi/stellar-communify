/** Wallet-address-prefixed query keys — see `services/auth/auth.queries.ts` for the convention. */
export const contentKeys = {
  all: (address: string | null) => ['content', address] as const,
  list: (address: string | null) => [...contentKeys.all(address), 'list'] as const,
  grid: (address: string | null) => [...contentKeys.all(address), 'grid'] as const,
  hasRead: (address: string | null, contentId: string) =>
    [...contentKeys.all(address), 'has-read', contentId] as const,
  isActive: (address: string | null) => [...contentKeys.all(address), 'is-active'] as const,
};
