import { Komunify, nativeToScVal, rpc, scValToNative, xdr as xdrNs } from '@komunify/contract-client';
import { env } from '../config/env.js';
import { currentEpoch, getBudget, getContent, getMemberReads, signingClient } from '../lib/soroban.js';
import { logger } from '../config/logger.js';

/**
 * "Settle all" for a closed cycle (approach C). `settle_member` is permissionless, so a server
 * keypair batches it on every un-settled subscriber's behalf — one manager click, no wallet
 * prompts. Each member is its own transaction: failures are isolated (one bad member never
 * reverts the rest), unlike an on-chain batch.
 *
 * MVP shape, with two documented upgrade points for real scale:
 *   1. Subscriber source is the RPC event scan below (~5.5h lookback). At scale, index
 *      `subscribed` events into Postgres instead of scanning.
 *   2. Submission is synchronous and capped (MAX_MEMBERS). At scale, move to a background job
 *      with progress + retry rather than one HTTP request.
 */

const KMF_TOPIC = 'kmf';
// Matches stats.service: ~5s/ledger on testnet -> ~5.5h of history. Enough for a demo cycle.
const EVENT_LOOKBACK_LEDGERS = 4000;
// Safety cap so one request never fans out unboundedly. Beyond this, settle in multiple calls
// (or move to the background-job upgrade above).
const MAX_MEMBERS = 200;

export interface SettleAllResult {
  epoch: number;
  attempted: number;
  settled: string[];
  failed: Array<{ member: string; error: string }>;
  /** True when more un-settled members existed than MAX_MEMBERS; call again to continue. */
  truncated: boolean;
}

function rpcServer(): rpc.Server {
  return new rpc.Server(env.SOROBAN_RPC_URL, { allowHttp: env.SOROBAN_RPC_URL.startsWith('http://') });
}

function scValToNativeSafe(val: xdrNs.ScVal): unknown {
  try {
    return scValToNative(val);
  } catch {
    return undefined;
  }
}

interface EpochEventScan {
  subscribed: Set<string>;
  settled: Set<string>;
  /** member -> distinct content ids they read this epoch (from `accessed` events). */
  accessed: Map<string, Set<string>>;
}

/**
 * One paginated scan of recent contract events for a given epoch. `subscribed` data is
 * `(price, expires_at, epoch)` (epoch at index 2); `settled` data is `(epoch, budget)` (epoch at
 * index 0); `accessed` data is `(content_id, epoch)` (epoch at index 1). Member is topic[2] on all
 * three. Shared by `unsettledMembers` and `pendingForManager` so both read the same event window.
 */
async function scanEpochEvents(epoch: number): Promise<EpochEventScan> {
  const server = rpcServer();
  const latest = await server.getLatestLedger();
  const startLedger = Math.max(1, latest.sequence - EVENT_LOOKBACK_LEDGERS);
  const kmfTopic = nativeToScVal(KMF_TOPIC, { type: 'symbol' }).toXDR('base64');

  const subscribed = new Set<string>();
  const settled = new Set<string>();
  const accessed = new Map<string, Set<string>>();
  let cursor: string | undefined;

  const filters = [
    { type: 'contract' as const, contractIds: [env.KOMUNIFY_CONTRACT_ID as string], topics: [[kmfTopic, '*', '*']] },
  ];

  // Page through events so we don't miss subscribers past the first 200. The request takes
  // either `startLedger` (first page) or `cursor` (subsequent pages), never both.
  for (let page = 0; page < 10; page++) {
    const response = await server.getEvents(
      cursor ? { cursor, filters, limit: 200 } : { startLedger, filters, limit: 200 },
    );

    for (const e of response.events) {
      const topics = e.topic.map((t) => scValToNativeSafe(t));
      const eventType = topics[1];
      const member = topics[2];
      if (typeof eventType !== 'string' || typeof member !== 'string') continue;
      const data = scValToNativeSafe(e.value);
      if (!Array.isArray(data)) continue;

      if (eventType === 'subscribed' && Number(data[2]) === epoch) subscribed.add(member);
      if (eventType === 'settled' && Number(data[0]) === epoch) settled.add(member);
      if (eventType === 'accessed' && Number(data[1]) === epoch) {
        const contentId = String(data[0]);
        const set = accessed.get(member) ?? new Set<string>();
        set.add(contentId);
        accessed.set(member, set);
      }
    }

    if (response.events.length < 200 || !response.cursor) break;
    cursor = response.cursor;
  }

  return { subscribed, settled, accessed };
}

async function unsettledMembers(epoch: number): Promise<string[]> {
  const { subscribed, settled } = await scanEpochEvents(epoch);
  return [...subscribed].filter((m) => !settled.has(m));
}

export interface PendingResult {
  epoch: number;
  amount: string;
}

/**
 * Read-only preview of what "pay out all readers" would credit this manager, without settling
 * anything. Replays `settle_member`'s split math (docs/CONTRACT_SPEC.md §3) per un-settled member
 * for the last closed epoch, using the same event window as `settleAllLastClosedCycle` — so this
 * is a preview of exactly what that call would do, not a fully independent computation. Dust
 * (division remainders) is intentionally omitted; it never reaches a manager's Accrued anyway.
 */
export async function pendingForManager(manager: string): Promise<PendingResult> {
  const cur = await currentEpoch();
  const epoch = cur - 1;
  if (epoch < 0) return { epoch: 0, amount: '0' };

  const { subscribed, settled, accessed } = await scanEpochEvents(epoch);
  const unsettled = [...subscribed].filter((m) => !settled.has(m));

  const contentCache = new Map<string, Komunify.Content>();
  let amount = 0n;

  for (const member of unsettled) {
    const contentIds = accessed.get(member);
    if (!contentIds || contentIds.size === 0) continue; // idle -> platform, not this manager

    const [budget, reads] = await Promise.all([getBudget(epoch, member), getMemberReads(epoch, member)]);
    if (budget === 0n || reads === 0) continue;

    const perContent = budget / BigInt(reads);
    for (const contentId of contentIds) {
      let content = contentCache.get(contentId);
      if (!content) {
        content = await getContent(BigInt(contentId));
        contentCache.set(contentId, content);
      }
      if (!content.managers.includes(manager)) continue;
      amount += perContent / BigInt(content.managers.length);
    }
  }

  return { epoch, amount: amount.toString() };
}

export async function settleAllLastClosedCycle(): Promise<SettleAllResult> {
  const cur = await currentEpoch();
  const epoch = cur - 1;
  if (epoch < 0) {
    // Epoch 0 is still open — nothing is closed yet.
    return { epoch: 0, attempted: 0, settled: [], failed: [], truncated: false };
  }

  const signer = signingClient();
  if (!signer) {
    throw new Error('SETTLE_SIGNER_NOT_CONFIGURED');
  }

  const all = await unsettledMembers(epoch);
  const members = all.slice(0, MAX_MEMBERS);
  const truncated = all.length > MAX_MEMBERS;

  const settled: string[] = [];
  const failed: SettleAllResult['failed'] = [];

  // Sequential: keeps sequence-number handling simple and load predictable. See upgrade note 2.
  for (const member of members) {
    try {
      const assembled = await signer.client.settle_member({ epoch, m: member });
      await assembled.signAndSend();
      settled.push(member);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // AlreadySettled (a race with a per-member payout) is benign — treat as success.
      if (message.includes('AlreadySettled') || message.includes('#10')) {
        settled.push(member);
      } else {
        logger.warn('settle-all: member failed', { epoch, member, error: message });
        failed.push({ member, error: message });
      }
    }
  }

  return { epoch, attempted: members.length, settled, failed, truncated };
}
