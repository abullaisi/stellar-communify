import { nativeToScVal, rpc, scValToNative, xdr as xdrNs } from '@komunify/contract-client';
import { env } from '../config/env.js';
import { currentEpoch, epochEndsAt, getStats } from '../lib/soroban.js';
import { logger } from '../config/logger.js';

const CACHE_TTL_MS = 10_000;
// Recent-events lookback window. ~5s/ledger on Soroban testnet -> ~5.5h of history. Wide enough
// for demo traffic without paging; RPC providers reject windows outside their retention anyway,
// which we treat as "no recent events" rather than a hard failure (see catch below).
const EVENT_LOOKBACK_LEDGERS = 4000;
const KMF_TOPIC = 'kmf';

export interface StatsResult {
  totalSubs: string;
  totalVolume: string;
  totalClaimed: string;
  contentCount: string;
  managerCount: number;
  currentEpoch: number;
  epochEndsAt: string;
  epochReads: number;
  recentEvents: Array<{
    type: 'subscribed' | 'content' | 'accessed' | 'settled' | 'claimed';
    wallet: string;
    amount?: string;
    ledger: number;
    txHash: string;
  }>;
}

let cache: { at: number; value: StatsResult } | null = null;

function rpcServer(): rpc.Server {
  const { rpcUrl } = { rpcUrl: env.SOROBAN_RPC_URL };
  return new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
}

async function fetchRecentEvents(epoch: number): Promise<{ events: StatsResult['recentEvents']; epochReads: number }> {
  if (!env.KOMUNIFY_CONTRACT_ID) {
    return { events: [], epochReads: 0 };
  }

  try {
    const server = rpcServer();
    const latest = await server.getLatestLedger();
    const startLedger = Math.max(1, latest.sequence - EVENT_LOOKBACK_LEDGERS);

    const kmfTopic = nativeToScVal(KMF_TOPIC, { type: 'symbol' }).toXDR('base64');
    const response = await server.getEvents({
      startLedger,
      filters: [{ type: 'contract', contractIds: [env.KOMUNIFY_CONTRACT_ID], topics: [[kmfTopic, '*', '*']] }],
      limit: 100,
    });

    const events: StatsResult['recentEvents'] = [];
    let epochReads = 0;

    for (const e of response.events) {
      const topics = e.topic.map((t) => scValToNativeSafe(t));
      const [, eventType, walletTopic] = topics;
      if (typeof eventType !== 'string') continue;

      if (eventType === 'accessed') {
        const data = scValToNativeSafe(e.value) as { epoch?: number } | undefined;
        if (data && Number(data.epoch) === epoch) epochReads += 1;
      }

      if (isRecentEventType(eventType)) {
        const data = scValToNativeSafe(e.value) as Record<string, unknown> | undefined;
        const amount = extractAmount(data);
        events.push({
          type: eventType,
          wallet: typeof walletTopic === 'string' ? walletTopic : String(walletTopic ?? ''),
          amount,
          ledger: e.ledger,
          txHash: e.txHash,
        });
      }
    }

    events.sort((a, b) => b.ledger - a.ledger);
    return { events: events.slice(0, 20), epochReads };
  } catch (err) {
    logger.warn('stats: getEvents failed, returning empty recentEvents', { error: (err as Error).message });
    return { events: [], epochReads: 0 };
  }
}

function isRecentEventType(t: string): t is StatsResult['recentEvents'][number]['type'] {
  return t === 'subscribed' || t === 'content' || t === 'accessed' || t === 'settled' || t === 'claimed';
}

function extractAmount(data: Record<string, unknown> | undefined): string | undefined {
  if (!data) return undefined;
  const raw = data.price ?? data.amount;
  return raw === undefined ? undefined : String(raw);
}

function scValToNativeSafe(val: xdrNs.ScVal): unknown {
  try {
    return scValToNative(val);
  } catch {
    return undefined;
  }
}

export async function getStatsResult(): Promise<StatsResult> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.value;
  }

  const [stats, epoch] = await Promise.all([getStats(), currentEpoch()]);
  const endsAt = await epochEndsAt(epoch);
  const { events, epochReads } = await fetchRecentEvents(epoch);

  const value: StatsResult = {
    totalSubs: stats.total_subs.toString(),
    totalVolume: stats.total_volume.toString(),
    totalClaimed: stats.total_claimed.toString(),
    contentCount: stats.content_count.toString(),
    managerCount: stats.manager_count,
    currentEpoch: epoch,
    epochEndsAt: new Date(Number(endsAt) * 1000).toISOString(),
    epochReads,
    recentEvents: events,
  };

  cache = { at: Date.now(), value };
  return value;
}
