/** Chain-global, not wallet-scoped — no address prefix needed, but kept for consistency. */
export const tractionKeys = {
  all: ['traction'] as const,
  stats: () => [...tractionKeys.all, 'stats'] as const,
};
