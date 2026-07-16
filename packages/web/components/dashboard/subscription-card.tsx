'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { ExplorerLink, TestnetNote } from '@/components/ui/trust';
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
  const insufficientBalance =
    balance.data !== undefined && config.data !== undefined && balance.data < config.data.price;

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
    <section className="card" style={{ maxWidth: 520, marginInline: 'auto' }}>
      <h2>Membership</h2>
      <span className="label">Single subscription multiple benefits</span>
      {config.isLoading ? (
        <Skeleton className="h-9 w-32 rounded-md" style={{ marginTop: 6 }} />
      ) : (
        <p className="balance">
          {config.data ? formatTokenAmount(config.data.price) : '…'}{' '}
          <ExplorerLink target="usdc" title="View the USDC token contract on Stellar Expert">
            USDC
          </ExplorerLink>
          <span className="label" style={{ textTransform: 'none', fontSize: 13, marginLeft: 6 }}>
            / month
          </span>
        </p>
      )}

      <div className="row tight" style={{ marginBottom: 10 }}>
        {status.isLoading ? (
          <Skeleton className="h-5 w-24 rounded-full" />
        ) : status.data?.isActive ? (
          <span className="pill ok">
            <Icon name="check" size={12} /> ACTIVE
          </span>
        ) : (
          <span className="pill warn">NOT A MEMBER YET</span>
        )}
        <span className="label" style={{ textTransform: 'none' }}>
          Wallet: {balance.data !== undefined ? formatTokenAmount(balance.data) : '…'} USDC
        </span>
      </div>

      <div className="row tight">
        <Button
          type="button"
          variant="outline"
          onClick={handleFaucet}
          disabled={faucet.isPending || !faucetReady}
        >
          <Icon name="coins" size={15} />
          {faucet.isPending
            ? 'Requesting…'
            : faucetReady
              ? 'Get free test USDC'
              : 'Faucet on cooldown'}
        </Button>
        <Button
          type="button"
          onClick={handleSubscribe}
          disabled={subscribe.isPending || !!status.data?.isActive || insufficientBalance}
          style={insufficientBalance ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          {subscribe.isPending ? (
            'Subscribing…'
          ) : status.data?.isActive ? (
            <>
              <Icon name="check" size={15} /> You&apos;re in
            </>
          ) : (
            <>
              <Icon name="key" size={15} /> Subscribe
            </>
          )}
        </Button>
      </div>
      {insufficientBalance && !status.data?.isActive ? (
        <p className="hint">Get test USDC first, the faucet is free.</p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="tx">
        <TestnetNote />
      </div>
    </section>
  );
}
