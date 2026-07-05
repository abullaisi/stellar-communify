/**
 * Notes service types (frontend shape).
 *
 * Mirrors the on-chain `Note` from @komunify/contract-client, but with `u64`
 * timestamps mapped from bigint to number for easy rendering.
 */

export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  id: number;
  title: string;
  content: string;
}

/** Technical detail of a submitted contract transaction. */
export interface TxInfo {
  /** Contract function invoked (e.g. "add_note"). */
  fn: string;
  /** Transaction hash. */
  hash: string;
  /** Final status from RPC (e.g. "SUCCESS", "FAILED"). */
  status: string;
  /** Ledger the tx was included in (present once confirmed). */
  ledger?: number;
  /** Ledger close time (unix seconds). */
  createdAt?: number;
  /** Fee charged, in stroops (1 XLM = 10,000,000 stroops). */
  feeCharged?: string;
  /** Contract the tx was sent to. */
  contractId: string;
  /** Network name the tx was submitted on. */
  network: string;
}

/** Result of creating a note: the new id plus its transaction detail. */
export interface CreateNoteResult {
  id: number;
  tx: TxInfo;
}

/** Result of an update/delete: the transaction detail. */
export interface WriteResult {
  tx: TxInfo;
}
