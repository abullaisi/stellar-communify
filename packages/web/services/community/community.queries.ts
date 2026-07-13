/** Community brand is keyed by the community's own wallet (not the viewer's) — it is public. */
export const communityKeys = {
  all: ['community'] as const,
  list: () => [...communityKeys.all, 'list'] as const,
  detail: (wallet: string | null) => [...communityKeys.all, wallet] as const,
};
