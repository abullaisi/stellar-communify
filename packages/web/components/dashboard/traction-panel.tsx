'use client';

import { useEffect, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ExplorerLink } from '@/components/ui/trust';
import { formatTokenAmount } from '@/lib/contracts';
import { useTractionStats } from '@/services/traction';

/** A stat cell: mono label + info tooltip, with the tabular number underneath. */
function Metric({ label, tip, children }: { label: string; tip: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label" style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
        {label}
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              aria-label={`What does “${label}” mean?`}
              style={{ display: 'inline-flex', color: 'var(--color-content-secondary)', cursor: 'help' }}
            >
              <Icon name="info" size={13} />
            </span>
          </TooltipTrigger>
          <TooltipContent>{tip}</TooltipContent>
        </Tooltip>
      </span>
      <p className="balance" style={{ fontSize: 20, margin: '2px 0' }}>
        {children}
      </p>
    </div>
  );
}

/** Human countdown that scales from days → seconds (cycles are 30 days; can be closed early). */
function Countdown({ endsAt }: { endsAt: bigint }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Number(endsAt) * 1000 - now;
  if (remaining <= 0) return <span style={{ fontVariantNumeric: 'tabular-nums' }}>closing…</span>;

  const d = Math.floor(remaining / 86_400_000);
  const h = Math.floor((remaining % 86_400_000) / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  const text = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}:${s.toString().padStart(2, '0')}`;
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{text}</span>;
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
          <Metric label="Subscribers" tip="Memberships bought across all communities, all-time.">
            {stats.data.totalSubs.toString()}
          </Metric>
          <Metric label="Volume" tip="Total USDC ever paid in subscriptions.">
            {formatTokenAmount(stats.data.totalVolume)} USDC
          </Metric>
          <Metric label="Content" tip="PDFs published across all communities.">
            {stats.data.contentCount.toString()}
          </Metric>
          <Metric label="Managers" tip="Wallets registered as community creators.">
            {stats.data.managerCount}
          </Metric>
          <Metric label="Paid to creators" tip="USDC creators have withdrawn from their earnings so far.">
            {formatTokenAmount(stats.data.totalClaimed)} USDC
          </Metric>
          <Metric
            label="This cycle ends in"
            tip="Time left in the current 30-day billing cycle. When it ends, that cycle’s earnings can be paid out to creators."
          >
            <Countdown endsAt={stats.data.epochEndsAt} />
          </Metric>
        </div>
      ) : (
        <p className="hint">Traction is loading from the chain. One moment.</p>
      )}
      <p className="hint" style={{ marginBottom: 0 }}>
        Every figure is{' '}
        <ExplorerLink title="Verify the contract state on Stellar Expert">live</ExplorerLink>{' '}
        on-chain state, not a database.
      </p>
    </section>
  );
}
