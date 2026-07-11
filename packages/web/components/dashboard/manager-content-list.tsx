'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTokenAmount } from '@/lib/contracts';
import { useAccrued, useClaim, useMyContent, useSettleMember } from '@/services/manager';

/**
 * My-content list (epoch reads, display only per D-009) + accrued balance + claim().
 * `settle_member` needs a member address and a closed epoch — Lane B's event feed (which
 * would let this auto-list "who read my content") isn't live yet, so it's a manual form:
 * the manager pastes a member address + epoch to settle. See CONTRACT_SPEC.md §3.
 */
export function ManagerContentList() {
  const myContent = useMyContent();
  const accrued = useAccrued();
  const claim = useClaim();
  const settle = useSettleMember();

  const [settleEpoch, setSettleEpoch] = useState('');
  const [settleMember, setSettleMember] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleClaim() {
    setError(null);
    try {
      await claim.mutateAsync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Claim failed');
    }
  }

  async function handleSettle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await settle.mutateAsync({ epoch: Number(settleEpoch), member: settleMember });
      setNotice(`Settled epoch ${settleEpoch} for ${settleMember.slice(0, 6)}…`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'settle_member failed');
    }
  }

  return (
    <section className="card">
      <h2>My content</h2>

      <span className="label">Accrued balance</span>
      {accrued.isLoading ? (
        <Skeleton className="h-9 w-32 rounded-md" />
      ) : (
        <p className="balance">{accrued.data !== undefined ? formatTokenAmount(accrued.data) : '—'} USDC</p>
      )}
      <Button type="button" onClick={handleClaim} disabled={claim.isPending || !accrued.data}>
        {claim.isPending ? 'Claiming…' : 'Claim'}
      </Button>

      <div className="tx">
        <span className="label">Content ({myContent.data?.length ?? 0})</span>
        {myContent.isLoading ? (
          <Skeleton className="h-12 w-full rounded-md" style={{ marginTop: 8 }} />
        ) : myContent.data && myContent.data.length > 0 ? (
          <dl className="tx-grid">
            {myContent.data.map((c) => (
              <div key={c.id} style={{ display: 'contents' }}>
                <dt>#{c.id}</dt>
                <dd>
                  {c.active ? <span className="pill ok">ACTIVE</span> : <span className="pill warn">INACTIVE</span>}{' '}
                  this-epoch reads: {c.epochReads}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="hint">No content registered by this wallet yet.</p>
        )}
      </div>

      <div className="tx">
        <span className="label">Settle a member (closed epoch)</span>
        <form onSubmit={handleSettle}>
          <Input
            placeholder="Epoch (e.g. 3)"
            value={settleEpoch}
            onChange={(e) => setSettleEpoch(e.target.value)}
            required
          />
          <Input
            placeholder="Member address (G...)"
            value={settleMember}
            onChange={(e) => setSettleMember(e.target.value)}
            required
          />
          <Button type="submit" variant="outline" disabled={settle.isPending}>
            {settle.isPending ? 'Settling…' : 'Settle'}
          </Button>
        </form>
        {notice ? <p className="success">{notice}</p> : null}
      </div>
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
