import { z } from 'zod';

/**
 * Traction dashboard aggregate. See docs/API_SPEC.md §3.
 *
 * `totalSubs` and `contentCount` are `u64` on-chain (`Stats.total_subs`,
 * `Stats.content_count`) and therefore cross the wire as strings per the
 * i128/u64-as-string rule (API_SPEC.md §3, last paragraph) — even though the
 * worked example in that section shows them as bare JSON numbers. That example
 * contradicts the rule stated directly beneath it; this schema follows the rule.
 * Flagged in docs/PROGRESS.md under "Blocked / needs human".
 */

export const RecentEventSchema = z.object({
  type: z.enum(['subscribed', 'content', 'accessed', 'settled', 'claimed']),
  wallet: z.string(),
  amount: z.string().optional(), // stringified i128, present for subscribed/claimed
  ledger: z.number().int(),
  txHash: z.string(),
});
export type RecentEvent = z.infer<typeof RecentEventSchema>;

export const StatsResponseSchema = z.object({
  totalSubs: z.string(), // stringified u64
  totalVolume: z.string(), // stringified i128
  totalClaimed: z.string(), // stringified i128
  contentCount: z.string(), // stringified u64
  managerCount: z.number().int(), // u32
  currentEpoch: z.number().int(), // u32
  epochEndsAt: z.string(), // ISO datetime
  epochReads: z.number().int(), // u32
  recentEvents: z.array(RecentEventSchema),
});
export type StatsResponse = z.infer<typeof StatsResponseSchema>;
