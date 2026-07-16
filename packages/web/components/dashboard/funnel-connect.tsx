'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/wallet-provider';
import { useCommunities } from '@/services/community';

import { StartCommunityCard } from './start-community-card';

/**
 * FunnelShell step-1 content (prototype index.html "wallet-disconnected" pattern):
 * a two-tone hero card plus a connect card. Wallet connect reuses the existing
 * `useWallet().connect` handler; partner count reuses the existing `useCommunities`
 * query that the sidenav already fetches for the partner list.
 */
export function FunnelConnect() {
  const { connect, connecting } = useWallet();
  const communities = useCommunities();
  const partners = communities.data?.communities ?? [];

  return (
    <>
      <div className="grid-2">
        <section className="card center">
          <h1 className="headline">
            Single subscription.
            <span className="gold">Multiple benefits.</span>
          </h1>
          <p className="hint">
            Komunify bundles Premium access and Member discounts across community partners with
            a single on-chain subscription.
          </p>
          <div className="avatar-group">
            {partners.slice(0, 4).map((p) => (
              <span key={p.wallet} className="avatar" title={p.name}>
                {p.name.charAt(0).toUpperCase()}
              </span>
            ))}
            <span className="avatar-note">
              {partners.length} partner {partners.length === 1 ? 'community' : 'communities'} in
              this bundle
            </span>
          </div>
        </section>

        <section className="card">
          <div className="num-label">
            <span className="num">01</span> WALLET
          </div>
          <p className="hint">
            Connect a Stellar wallet to see your balance and subscribe. This runs on testnet, no
            real funds move.
          </p>
          <Button type="button" onClick={connect} disabled={connecting}>
            {connecting ? 'Connecting…' : 'Connect Wallet'}
          </Button>
        </section>
      </div>

      <StartCommunityCard />
    </>
  );
}
