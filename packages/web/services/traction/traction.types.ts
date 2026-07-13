export interface TractionStats {
  totalSubs: bigint;
  totalVolume: bigint;
  totalClaimed: bigint;
  contentCount: bigint;
  managerCount: number;
  currentEpoch: number;
  epochEndsAt: bigint; // unix seconds
}
