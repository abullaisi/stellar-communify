'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTokenAmount } from '@/lib/contracts';
import {
  useConfig,
  useFaucet,
  useFaucetAvailableAt,
  useSubscribe,
  useSubscriptionStatus,
  useUsdcBalance,
} from '@/services/subscription';

/** Member subscription status card (DESIGN.md §4.2 "Subscription card"): price as `.balance`,
 *  status pill, faucet + subscribe CTAs. */
export function SubscriptionCard() {
  const status = useSubscriptionStatus();
  const config = useConfig();
  const balance = useUsdcBalance();
  const faucetAt = useFaucetAvailableAt();
  const subscribe = useSubscribe();
  const faucet = useFaucet();
  const [error, setError] = useState<string | null>(null);

  const faucetReady = !faucetAt.data || faucetAt.data === 0n || faucetAt.data * 1000n <= BigInt(Date.now());

  async function handleFaucet() {
    setError(null);
    try {
      await faucet.mutateAsync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Faucet call failed');
    }
  }

  async function handleSubscribe() {
    setError(null);
    try {
      await subscribe.mutateAsync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Subscribe failed');
    }
  }

  return (
    <section className="card">
      <h2>Subscription</h2>
      <span className="label">Price / epoch</span>
      {config.isLoading ? (
        <Skeleton className="h-9 w-32 rounded-md" />
      ) : (
        <p className="balance">
          {config.data ? formatTokenAmount(config.data.price) : '—'} USDC
        </p>
      )}

      <div className="row tight" style={{ marginBottom: 12 }}>
        {status.isLoading ? (
          <Skeleton className="h-5 w-20 rounded-full" />
        ) : status.data?.isActive ? (
          <span className="pill ok">ACTIVE</span>
        ) : (
          <span className="pill warn">INACTIVE</span>
        )}
        <span className="label" style={{ textTransform: 'none' }}>
          Balance: {balance.data !== undefined ? formatTokenAmount(balance.data) : '—'} USDC
        </span>
      </div>

      <div className="row tight">
        <Button
          type="button"
          variant="outline"
          onClick={handleFaucet}
          disabled={faucet.isPending || !faucetReady}
        >
          {faucet.isPending
            ? 'Requesting…'
            : faucetReady
              ? 'Get test USDC'
              : 'Faucet on cooldown'}
        </Button>
        <Button
          type="button"
          onClick={handleSubscribe}
          disabled={subscribe.isPending || !!status.data?.isActive}
        >
          {subscribe.isPending
            ? 'Subscribing…'
            : status.data?.isActive
              ? 'Subscribed'
              : 'Subscribe'}
        </Button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
