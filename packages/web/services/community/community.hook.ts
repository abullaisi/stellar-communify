'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CommunityService } from './community.service';
import { communityKeys } from './community.queries';

/** Public brand for a community page (or the manager's own). Null when none is set. */
export function useCommunity(wallet: string | null) {
  return useQuery({
    queryKey: communityKeys.detail(wallet),
    queryFn: () => CommunityService.get(wallet as string),
    enabled: !!wallet,
  });
}

export function useSaveCommunity(wallet: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: CommunityService.save,
    onSuccess: (brand) => {
      qc.setQueryData(communityKeys.detail(wallet), brand);
      qc.invalidateQueries({ queryKey: communityKeys.detail(wallet) });
    },
  });
}
