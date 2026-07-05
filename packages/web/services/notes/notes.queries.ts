/**
 * Notes query key factory.
 * Keys are scoped by owner address so switching wallets doesn't mix caches.
 */

export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (owner: string | undefined) => [...noteKeys.lists(), owner] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (owner: string | undefined, id: number) => [...noteKeys.details(), owner, id] as const,
};
