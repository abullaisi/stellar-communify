'use client';

import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { formatTokenAmount } from '@/lib/contracts';
import { useTractionStats } from '@/services/traction';

function Countdown({ endsAt }: { endsAt: bigint }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Number(endsAt) * 1000 - now;
  if (remaining <= 0) return <span style={{ fontVariantNumeric: 'tabular-nums' }}>closing…</span>;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

/** Stat chips + epoch countdown (DESIGN.md §4.2 "Dashboard stat chips"). Every number tabular-nums.
 *  `recentEvents` needs Lane B's `getEvents` indexing — not shown yet, see `TractionService`. */
export function TractionPanel() {
  const stats = useTractionStats();

  return (
    <section className="card">
      <h2>Traction</h2>
      {stats.isLoading ? (
        <Skeleton className="h-24 w-full rounded-md" />
      ) : stats.data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <span className="label">Subscribers</span>
            <p className="balance" style={{ fontSize: 20, margin: '2px 0' }}>
              {stats.data.totalSubs.toString()}
            </p>
          </div>
          <div>
            <span className="label">Volume</span>
            <p className="balance" style={{ fontSize: 20, margin: '2px 0' }}>
              {formatTokenAmount(stats.data.totalVolume)} USDC
            </p>
          </div>
          <div>
            <span className="label">Content</span>
            <p className="balance" style={{ fontSize: 20, margin: '2px 0' }}>
              {stats.data.contentCount.toString()}
            </p>
          </div>
          <div>
            <span className="label">Managers</span>
            <p className="balance" style={{ fontSize: 20, margin: '2px 0' }}>
              {stats.data.managerCount}
            </p>
          </div>
          <div>
            <span className="label">Claimed</span>
            <p className="balance" style={{ fontSize: 20, margin: '2px 0' }}>
              {formatTokenAmount(stats.data.totalClaimed)} USDC
            </p>
          </div>
          <div>
            <span className="label">Epoch #{stats.data.currentEpoch} ends in</span>
            <p className="balance" style={{ fontSize: 20, margin: '2px 0' }}>
              <Countdown endsAt={stats.data.epochEndsAt} />
            </p>
          </div>
        </div>
      ) : (
        <p className="hint">Stats unavailable.</p>
      )}
      <p className="hint" style={{ marginBottom: 0 }}>
        Recent events feed needs the API&apos;s event indexer — coming with Lane B&apos;s <code>/stats</code>.
      </p>
    </section>
  );
}
