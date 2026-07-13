'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useWallet } from '@/providers/wallet-provider';

import { ManagerService } from './manager.service';
import { managerKeys } from './manager.queries';

/** Role check for /dashboard routing (D-006): one route, manager vs member panel. */
export function useIsManager() {
  const { address } = useWallet();
  return useQuery({
    queryKey: managerKeys.isManager(address),
    queryFn: () => ManagerService.isManager(address as string),
    enabled: !!address,
  });
}

export function useMyContent() {
  const { address } = useWallet();
  return useQuery({
    queryKey: managerKeys.myContent(address),
    queryFn: () => ManagerService.myContent(address as string),
    enabled: !!address,
  });
}

export function useAccrued() {
  const { address } = useWallet();
  return useQuery({
    queryKey: managerKeys.accrued(address),
    queryFn: () => ManagerService.accrued(address as string),
    enabled: !!address,
    refetchInterval: 15_000,
  });
}

export function useClaim() {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!address) throw new Error('Connect a wallet first');
      return ManagerService.claim(address);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: managerKeys.all(address) }),
  });
}

/** Preview of what "pay out all readers" would add to this manager's balance right now. */
export function usePendingBalance() {
  const { address } = useWallet();
  return useQuery({
    queryKey: managerKeys.pending(address),
    queryFn: () => ManagerService.pending(),
    enabled: !!address,
    refetchInterval: 15_000,
  });
}

/**
 * Settle every un-settled subscriber of the last closed cycle in one call (approach C). The API
 * signs server-side, so no wallet prompt. Refreshes earnings/accrued/pending on success.
 */
export function useSettleAll() {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ManagerService.settleAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: managerKeys.all(address) }),
  });
}

/** Current billing cycle number (`current_epoch`). Chain-global, refetched periodically. */
export function useCurrentEpoch() {
  return useQuery({
    queryKey: ['manager', 'current-epoch'],
    queryFn: () => ManagerService.currentEpoch(),
    refetchInterval: 30_000,
  });
}

/** Admin-only: force-close the current cycle for the demo (D-012). Refreshes everything. */
export function useForceCloseEpoch() {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!address) throw new Error('Connect a wallet first');
      return ManagerService.forceCloseEpoch(address);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: managerKeys.all(address) });
      qc.invalidateQueries({ queryKey: ['manager', 'current-epoch'] });
    },
  });
}

export function useRegisterContent() {
  const { address } = useWallet();
  return useMutation({
    mutationFn: (sha256: Uint8Array) => {
      if (!address) throw new Error('Connect a wallet first');
      return ManagerService.registerContent(address, sha256);
    },
  });
}

/** Self-register as a manager on-chain (D-011). Invalidates the role queries on success. */
export function useBecomeManager() {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!address) throw new Error('Connect a wallet first');
      return ManagerService.becomeManager(address);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: managerKeys.all(address) }),
  });
}
