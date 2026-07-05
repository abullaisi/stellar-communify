/**
 * Notes React Query hooks.
 *
 * The owner address comes from the connected Freighter wallet (`useWallet`), so
 * these hooks must be used under both <WalletProvider> and <QueryProvider>.
 * Queries are disabled until a wallet is connected.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import type { ApiResponse } from '@komunify/shared';
import { useWallet } from '@/providers/wallet-provider';
import { noteKeys } from './notes.queries';
import { NotesService } from './notes.service';
import type {
  CreateNoteInput,
  CreateNoteResult,
  Note,
  UpdateNoteInput,
  WriteResult,
} from './notes.types';

/** List the connected wallet's notes. */
export function useNotes(
  options?: Omit<UseQueryOptions<ApiResponse<Note[]>>, 'queryKey' | 'queryFn'>,
) {
  const { address } = useWallet();
  return useQuery({
    queryKey: noteKeys.list(address ?? undefined),
    queryFn: () => NotesService.list(address as string),
    enabled: !!address,
    ...options,
  });
}

/** Create a note for the connected wallet. */
export function useCreateNote(
  options?: UseMutationOptions<ApiResponse<CreateNoteResult>, Error, CreateNoteInput>,
) {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNoteInput) => NotesService.create(address as string, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteKeys.lists() }),
    ...options,
  });
}

/** Update one of the connected wallet's notes. */
export function useUpdateNote(
  options?: UseMutationOptions<ApiResponse<WriteResult>, Error, UpdateNoteInput>,
) {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNoteInput) => NotesService.update(address as string, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteKeys.lists() }),
    ...options,
  });
}

/** Delete one of the connected wallet's notes. */
export function useDeleteNote(options?: UseMutationOptions<ApiResponse<WriteResult>, Error, number>) {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => NotesService.remove(address as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: noteKeys.lists() }),
    ...options,
  });
}
