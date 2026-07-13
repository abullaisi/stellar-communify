'use client';

import { NetworkGuard } from '@/components/wallet/network-guard';
import { ExploreCta } from '@/components/ui/explore-cta';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/providers/wallet-provider';
import { useMe } from '@/services/auth';
import { useIsManager } from '@/services/manager';

import { ManagerPanel } from './manager-panel';
import { MemberPanel } from './member-panel';
import { SignInCard } from './session-card';
import { StartCommunityCard } from './start-community-card';
import { TractionPanel } from './traction-panel';

/** `/dashboard` shell — one route, manager vs member panel from `is_manager(wallet)` (D-006). */
export function DashboardShell() {
  const { isConnected } = useWallet();
  const me = useMe();
  const isManager = useIsManager();

  // A connected wallet is not yet a session: upload/confirm/download all need the kmf_session
  // cookie (D-001), so gate the panels behind sign-in.
  const isAuthenticated = !!me.data;

  return (
    <>
      <header>
        <p className="tagline" style={{ marginTop: 0 }}>One subscription. Every community.</p>
        <ExploreCta />
      </header>

      <NetworkGuard />

      {!isConnected ? (
        <section className="card center">
          <span className="label" style={{ display: 'block', marginBottom: 6 }}>Step 1 of 2</span>
          <p style={{ margin: '0 0 4px', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="wallet" size={16} /> Connect your wallet
          </p>
          <p className="hint" style={{ margin: 0 }}>
            Your Stellar wallet is your account here. No email, no password. Connect Freighter to
            get started.
          </p>
        </section>
      ) : me.isLoading ? (
        <section className="card">
          <Skeleton className="h-24 w-full rounded-md" />
        </section>
      ) : !isAuthenticated ? (
        <SignInCard />
      ) : isManager.isLoading ? (
        <section className="card">
          <Skeleton className="h-24 w-full rounded-md" />
        </section>
      ) : isManager.data ? (
        <ManagerPanel />
      ) : (
        <>
          {/* Self-serve (D-011): a signed-in non-manager can start a community and become one. */}
          <StartCommunityCard />
          <MemberPanel />
        </>
      )}

      <TractionPanel />
    </>
  );
}
