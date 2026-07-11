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

export function useSettleMember() {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ epoch, member }: { epoch: number; member: string }) => {
      if (!address) throw new Error('Connect a wallet first');
      return ManagerService.settleMember(address, epoch, member);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: managerKeys.all(address) }),
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
