import { getKomunifyClient } from '@/lib/contracts';

import type { TractionStats } from './traction.types';

/**
 * `GET /stats` (API_SPEC.md §3) is Lane B's 10-second-cached aggregate, including a
 * `recentEvents` feed from RPC `getEvents`. Lane B has not landed the route yet, so this
 * reads the same `get_stats()` + `current_epoch()` + `epoch_ends_at()` simulations directly
 * from the contract — everything except `recentEvents`, which needs `getEvents` indexing
 * this lane does not own. Swap to `ApiHttp.get(API_ENDPOINTS.stats)` once Lane B ships;
 * `recentEvents` stays empty until then (flagged in docs/PROGRESS.md).
 */
export class TractionService {
  static async stats(): Promise<TractionStats> {
    const client = getKomunifyClient();
    const statsTx = await client.get_stats();
    const epochTx = await client.current_epoch();
    const endsAtTx = await client.epoch_ends_at({ epoch: epochTx.result });
    const s = statsTx.result;
    return {
      totalSubs: s.total_subs,
      totalVolume: s.total_volume,
      totalClaimed: s.total_claimed,
      contentCount: s.content_count,
      managerCount: s.manager_count,
      currentEpoch: epochTx.result,
      epochEndsAt: endsAtTx.result,
    };
  }
}
