/**
 * Notes service — Soroban-contract-backed.
 *
 * Same shape as the REST services (returns `ApiResponse<T>`), but instead of the
 * HTTP `ApiClient` it calls the notes contract via the generated bindings:
 * - reads (`list`, `get`) simulate over RPC and need no wallet;
 * - writes (`create`, `update`, `remove`) are signed by Freighter and submitted.
 */

import type { Note as ContractNote } from '@komunify/contract-client';
import type { ApiResponse } from '@komunify/shared';
import { getNotesClient } from '@/lib/notes-client';
import { getStellarConfig } from '@/lib/stellar';
import type {
  CreateNoteInput,
  CreateNoteResult,
  Note,
  TxInfo,
  UpdateNoteInput,
  WriteResult,
} from './notes.types';

function toNote(n: ContractNote): Note {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    createdAt: Number(n.created_at),
    updatedAt: Number(n.updated_at),
  };
}

/** Minimal structural view of the SDK's SentTransaction (avoids SDK generics). */
interface SentLike {
  sendTransactionResponse?: { hash?: string; status?: string };
  getTransactionResponse?: {
    status?: string;
    ledger?: number;
    createdAt?: number;
    resultXdr?: { feeCharged(): { toString(): string } };
  };
}

/** Pull the technical transaction detail out of a submitted contract call. */
function describeTx(sent: SentLike, fn: string): TxInfo {
  const cfg = getStellarConfig();
  const get = sent.getTransactionResponse;
  let feeCharged: string | undefined;
  try {
    feeCharged = get?.resultXdr?.feeCharged().toString();
  } catch {
    // resultXdr not available (e.g. tx not confirmed) — leave fee undefined.
  }
  return {
    fn,
    hash: sent.sendTransactionResponse?.hash ?? '',
    status: get?.status ?? sent.sendTransactionResponse?.status ?? 'UNKNOWN',
    ledger: get?.ledger,
    createdAt: get?.createdAt,
    feeCharged,
    contractId: cfg.contractId,
    network: cfg.network,
  };
}

function fail(error: unknown): ApiResponse<never> {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Contract call failed',
  };
}

export class NotesService {
  /** List all notes owned by `owner` (read-only, no wallet). */
  static async list(owner: string): Promise<ApiResponse<Note[]>> {
    try {
      const tx = await getNotesClient().list_notes({ owner });
      return { success: true, data: tx.result.map(toNote) };
    } catch (error) {
      return fail(error);
    }
  }

  /** Fetch a single note. */
  static async get(owner: string, id: number): Promise<ApiResponse<Note>> {
    try {
      const tx = await getNotesClient().get_note({ owner, id });
      return { success: true, data: toNote(tx.result.unwrap()) };
    } catch (error) {
      return fail(error);
    }
  }

  /** Create a note (signs via Freighter). Returns the new note id + tx detail. */
  static async create(
    owner: string,
    input: CreateNoteInput,
  ): Promise<ApiResponse<CreateNoteResult>> {
    try {
      const tx = await getNotesClient(owner).add_note({
        owner,
        title: input.title,
        content: input.content,
      });
      const sent = await tx.signAndSend();
      return { success: true, data: { id: sent.result, tx: describeTx(sent, 'add_note') } };
    } catch (error) {
      return fail(error);
    }
  }

  /** Update a note's title/content (signs via Freighter). Returns tx detail. */
  static async update(owner: string, input: UpdateNoteInput): Promise<ApiResponse<WriteResult>> {
    try {
      const tx = await getNotesClient(owner).update_note({
        owner,
        id: input.id,
        title: input.title,
        content: input.content,
      });
      const sent = await tx.signAndSend();
      return { success: true, data: { tx: describeTx(sent, 'update_note') } };
    } catch (error) {
      return fail(error);
    }
  }

  /** Delete a note (signs via Freighter). Returns tx detail. */
  static async remove(owner: string, id: number): Promise<ApiResponse<WriteResult>> {
    try {
      const tx = await getNotesClient(owner).delete_note({ owner, id });
      const sent = await tx.signAndSend();
      return { success: true, data: { tx: describeTx(sent, 'delete_note') } };
    } catch (error) {
      return fail(error);
    }
  }
}
