/** Result of `POST /manager/settle-all` — mirrors the API's `SettleAllResult`. */
export interface SettleAllResult {
  epoch: number;
  attempted: number;
  settled: string[];
  failed: Array<{ member: string; error: string }>;
  truncated: boolean;
}

/** Result of `GET /manager/pending` — mirrors the API's `PendingResult`. `amount` is base units. */
export interface PendingResult {
  epoch: number;
  amount: string;
}

export interface ManagerContent {
  id: string; // stringified u64
  creator: string;
  managers: string[];
  active: boolean;
  sha256: string; // hex
  /** This-epoch unique reads (display only, `get_content_reads`). */
  epochReads: number;
}
