'use client';

import { ConnectWalletButton } from '@/components/wallet/connect-wallet-button';
import { NetworkGuard } from '@/components/wallet/network-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/providers/wallet-provider';
import { useIsManager } from '@/services/manager';

import { ManagerPanel } from './manager-panel';
import { MemberPanel } from './member-panel';
import { TractionPanel } from './traction-panel';

/** `/dashboard` shell — one route, manager vs member panel from `is_manager(wallet)` (D-006). */
export function DashboardShell() {
  const { isConnected } = useWallet();
  const isManager = useIsManager();

  return (
    <>
      <header>
        <h1 className="logo">komunify</h1>
        <p className="tagline">One subscription. Every community.</p>
      </header>

      <div className="card">
        <ConnectWalletButton />
      </div>
      <NetworkGuard />

      {!isConnected ? (
        <section className="card center">
          <p className="hint" style={{ margin: 0 }}>
            Connect Freighter to see your dashboard.
          </p>
        </section>
      ) : isManager.isLoading ? (
        <section className="card">
          <Skeleton className="h-24 w-full rounded-md" />
        </section>
      ) : isManager.data ? (
        <ManagerPanel />
      ) : (
        <MemberPanel />
      )}

      <TractionPanel />
    </>
  );
}
