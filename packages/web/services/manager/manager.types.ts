export interface ManagerContent {
  id: string; // stringified u64
  creator: string;
  managers: string[];
  active: boolean;
  sha256: string; // hex
  /** This-epoch unique reads (display only, `get_content_reads`). */
  epochReads: number;
}
