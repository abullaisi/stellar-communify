'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useWallet } from '@/providers/wallet-provider';

import { ApiError } from '../api/http';
import { ContentService } from './content.service';
import { contentKeys } from './content.queries';
import type { DownloadResponse } from './content.types';

export function useContentList() {
  const { address } = useWallet();
  return useQuery({
    queryKey: contentKeys.list(address),
    queryFn: () => ContentService.list(),
  });
}

/** On-chain fallback for the content grid — see `ContentService.listOnChain`. */
export function useContentGrid() {
  const { address } = useWallet();
  return useQuery({
    queryKey: contentKeys.grid(address),
    queryFn: () => ContentService.listOnChain(),
  });
}

export function useUploadContent() {
  return useMutation({
    mutationFn: ({ file, title, description }: { file: File; title: string; description: string }) =>
      ContentService.upload(file, title, description),
  });
}

export function useConfirmContent() {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ draftId, contentId, txHash }: { draftId: string; contentId: string; txHash: string }) =>
      ContentService.confirm(draftId, contentId, txHash),
    onSuccess: () => qc.invalidateQueries({ queryKey: contentKeys.all(address) }),
  });
}

export function useIsActive() {
  const { address } = useWallet();
  return useQuery({
    queryKey: contentKeys.isActive(address),
    queryFn: () => ContentService.isActive(address as string),
    enabled: !!address,
  });
}

export function useHasRead(contentId: string) {
  const { address } = useWallet();
  return useQuery({
    queryKey: contentKeys.hasRead(address, contentId),
    queryFn: async () => {
      const epoch = await ContentService.currentEpoch();
      return ContentService.hasRead(epoch, BigInt(contentId), address as string);
    },
    enabled: !!address,
  });
}

/**
 * The download flow, PLAN.md §2, exactly:
 *   1. simulate has_read(currentEpoch, contentId, wallet) — skip the signature if
 *      already recorded.
 *   2. otherwise sign + submit record_access (idempotent, Freighter prompts).
 *   3. call GET /content/:id/download. The API independently re-checks is_active
 *      + has_read — a 403 READ_NOT_RECORDED here is the expected signal to sign
 *      record_access and retry once, not an error toast (API_SPEC.md §2).
 */
export function useOpenContent(contentId: string) {
  const { address } = useWallet();
  const qc = useQueryClient();

  return useMutation<DownloadResponse, Error, void>({
    mutationFn: async () => {
      if (!address) throw new Error('Connect a wallet first');
      const bigId = BigInt(contentId);

      const epoch = await ContentService.currentEpoch();
      const alreadyRead = await ContentService.hasRead(epoch, bigId, address);
      if (!alreadyRead) {
        await ContentService.recordAccess(address, bigId);
      }

      try {
        return await ContentService.download(contentId);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'READ_NOT_RECORDED') {
          // The API's simulation raced ours (e.g. tx not yet reflected). Retry
          // once — record_access is idempotent, this costs a fee, not a bug.
          await ContentService.recordAccess(address, bigId);
          return await ContentService.download(contentId);
        }
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contentKeys.all(address) });
    },
  });
}
