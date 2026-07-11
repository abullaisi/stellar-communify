'use client';

import { useQuery } from '@tanstack/react-query';

import { TractionService } from './traction.service';
import { tractionKeys } from './traction.queries';

export function useTractionStats() {
  return useQuery({
    queryKey: tractionKeys.stats(),
    queryFn: () => TractionService.stats(),
    refetchInterval: 15_000,
  });
}
