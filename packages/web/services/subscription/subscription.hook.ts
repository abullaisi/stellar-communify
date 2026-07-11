'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useWallet } from '@/providers/wallet-provider';

import { SubscriptionService } from './subscription.service';
import { subscriptionKeys } from './subscription.queries';

export function useSubscriptionStatus() {
  const { address } = useWallet();
  return useQuery({
    queryKey: subscriptionKeys.status(address),
    queryFn: () => SubscriptionService.status(address as string),
    enabled: !!address,
  });
}

export function useConfig() {
  const { address } = useWallet();
  return useQuery({
    queryKey: subscriptionKeys.price(address),
    queryFn: () => SubscriptionService.config(),
    // Config is chain-global, not per-wallet, but still gated on a connected
    // wallet so we don't simulate before the app has anything to do with it.
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsdcBalance() {
  const { address } = useWallet();
  return useQuery({
    queryKey: subscriptionKeys.usdcBalance(address),
    queryFn: () => SubscriptionService.usdcBalance(address as string),
    enabled: !!address,
  });
}

export function useFaucetAvailableAt() {
  const { address } = useWallet();
  return useQuery({
    queryKey: subscriptionKeys.faucetAvailableAt(address),
    queryFn: () => SubscriptionService.faucetAvailableAt(address as string),
    enabled: !!address,
  });
}

export function useSubscribe() {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!address) throw new Error('Connect a wallet first');
      return SubscriptionService.subscribe(address);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionKeys.all(address) }),
  });
}

export function useFaucet() {
  const { address } = useWallet();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!address) throw new Error('Connect a wallet first');
      return SubscriptionService.faucet(address);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionKeys.all(address) }),
  });
}
