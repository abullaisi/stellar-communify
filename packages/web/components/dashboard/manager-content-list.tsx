'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { OnChainProof } from '@/components/ui/trust';
import { formatTokenAmount } from '@/lib/contracts';
import { accountExplorerUrl, getStellarConfig } from '@/lib/stellar';
import { useWallet } from '@/providers/wallet-provider';
import {
  useAccrued,
  useClaim,
  useCurrentEpoch,
  useForceCloseEpoch,
  useMyContent,
  usePendingBalance,
  useSettleAll,
} from '@/services/manager';
import { useConfig } from '@/services/subscription';

/**
 * Manager earnings + content + payout. Money is per-member (D-009): a reader's payment is split
 * across the content they read when their cycle closes, landing in the manager's pending balance.
 * Settle-all moves that pending balance into the active (withdrawable) balance in one call; claim
 * withdraws it. Admin can `force_close_epoch` to end the cycle on demand for the demo (D-012).
 */
export function ManagerContentList() {
  const { address } = useWallet();
  const myContent = useMyContent();
  const accrued = useAccrued();
  const pending = usePendingBalance();
  const claim = useClaim();
  const settleAll = useSettleAll();
  const config = useConfig();
  const currentEpoch = useCurrentEpoch();
  const forceClose = useForceCloseEpoch();

  const isAdmin = !!address && config.data?.admin === address;
  const pendingAmount = pending.data ? BigInt(pending.data.amount) : undefined;

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const accountUrl = address ? accountExplorerUrl(address, getStellarConfig().network) : null;

  async function handleClaim() {
    setError(null);
    setNotice(null);
    try {
      await claim.mutateAsync();
      setNotice('Withdrawn to your wallet.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Withdraw failed');
    }
  }

  async function handleForceClose() {
    setError(null);
    setNotice(null);
    try {
      await forceClose.mutateAsync();
      setNotice('Cycle closed. Readers can now be paid out.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t close the cycle');
    }
  }

  async function handleSettleAll() {
    setError(null);
    setNotice(null);
    try {
      const result = await settleAll.mutateAsync();
      if (result.attempted === 0) {
        setNotice('Nothing pending to move.');
      } else {
        const parts = ['Moved to your active balance.'];
        if (result.failed.length) parts.push(`${result.failed.length} failed — try again.`);
        if (result.truncated) parts.push('More remain — run it again.');
        setNotice(parts.join(' '));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t move your pending balance');
    }
  }

  return (
    <section className="card">
      <h2>Earnings</h2>

      <span className="label">Active balance</span>
      {accrued.isLoading ? (
        <Skeleton className="h-9 w-32 rounded-md" style={{ marginTop: 6 }} />
      ) : (
        <p className="balance">{accrued.data !== undefined ? formatTokenAmount(accrued.data) : '…'} USDC</p>
      )}
      <Button type="button" onClick={handleClaim} disabled={claim.isPending || !accrued.data}>
        <Icon name="coins" size={15} />
        {claim.isPending ? 'Withdrawing…' : 'Withdraw'}
      </Button>
      <div>
        <p className="hint" style={{ marginBottom: 8 }}>
          Paid straight to your wallet. No middleman.
        </p>
        <p className="hint" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 0 }}>
          <OnChainProof label="Contract" />
          {accountUrl ? (
            <a
              href={accountUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: 'var(--color-content-accent)' }}
            >
              <Icon name="wallet" size={14} /> Your account <Icon name="external" size={13} />
            </a>
          ) : null}
        </p>
      </div>

      {/* Your content */}
      <div className="tx">
        <span className="label">Your content ({myContent.data?.length ?? 0})</span>
        {myContent.isLoading ? (
          <Skeleton className="h-12 w-full rounded-md" style={{ marginTop: 8 }} />
        ) : myContent.data && myContent.data.length > 0 ? (
          <dl className="tx-grid" style={{ marginTop: 8 }}>
            {myContent.data.map((c) => (
              <div key={c.id} style={{ display: 'contents' }}>
                <dt>#{c.id}</dt>
                <dd style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {c.active ? (
                    <span className="pill ok">
                      <Icon name="check" size={11} /> LIVE
                    </span>
                  ) : (
                    <span className="pill warn">HIDDEN</span>
                  )}
                  <span className="label" style={{ textTransform: 'none' }}>
                    {c.epochReads} {c.epochReads === 1 ? 'read' : 'reads'} this cycle
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Icon name="upload" size={15} />
            Nothing published yet. Add your first content above.
          </p>
        )}
      </div>

      {/* Get paid: pending balance -> active balance, plus force-close (admin/demo) */}
      <div className="tx">
        <span className="label">Pending balance</span>
        {pending.isLoading ? (
          <Skeleton className="h-9 w-32 rounded-md" style={{ marginTop: 6 }} />
        ) : (
          <p className="balance">{pendingAmount !== undefined ? formatTokenAmount(pendingAmount) : '…'} USDC</p>
        )}
        <p className="hint" style={{ marginTop: 4, marginBottom: 12 }}>
          Earned from reads, not yet in your active balance.
        </p>

        {isAdmin ? (
          <div style={{ marginBottom: 12 }}>
            <Button type="button" variant="outline" onClick={handleForceClose} disabled={forceClose.isPending}>
              <Icon name="flag" size={15} />
              {forceClose.isPending ? 'Closing…' : `Close cycle ${currentEpoch.data ?? ''} now`}
            </Button>
            <p className="hint" style={{ marginBottom: 0 }}>
              Demo tool: makes this cycle’s earnings available to move to your active balance.
            </p>
          </div>
        ) : null}

        <div style={{ marginBottom: 12 }}>
          <Button
            type="button"
            onClick={handleSettleAll}
            disabled={settleAll.isPending || pendingAmount === 0n}
          >
            <Icon name="coins" size={15} />
            {settleAll.isPending ? 'Moving…' : 'Move to active balance'}
          </Button>
          <p className="hint" style={{ marginBottom: 0 }}>
            No wallet signing needed.
          </p>
        </div>
      </div>

      {notice ? (
        <p className="success" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Icon name="check" size={14} /> {notice}
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
