'use client';

import { Button } from '@/components/ui/button';
import { getStellarConfig } from '@/lib/stellar';
import { useWallet } from '@/providers/wallet-provider';

/** App network name -> Freighter's network label. */
const FREIGHTER_LABEL: Record<string, string> = {
  testnet: 'TESTNET',
  mainnet: 'PUBLIC',
  futurenet: 'FUTURENET',
  local: 'STANDALONE',
};

/**
 * Guards against a network mismatch between Freighter and the app.
 *
 * Freighter does NOT expose a programmatic network switch (only the user can change
 * it inside the extension), so this shows guidance + a re-check button rather than a
 * switch button. It renders nothing when the networks already match. The wallet
 * watcher updates automatically within ~2s once the user switches.
 */
export function NetworkGuard() {
  const { isConnected, network, refresh, refreshing } = useWallet();
  const expected = FREIGHTER_LABEL[getStellarConfig().network] ?? 'TESTNET';

  // Nothing to guard until we know the wallet's network, or if it already matches.
  if (!isConnected || !network) return null;
  if (network.toUpperCase() === expected) return null;

  return (
    <section className="card">
      <div className="row">
        <h2 style={{ margin: 0 }}>Wrong network</h2>
        <span className="pill warn">{network}</span>
      </div>
      <p className="hint">
        This app runs on <strong>{expected}</strong>. Open the Freighter extension, switch the
        network to {expected} using its network dropdown, then re-check below.
      </p>
      <Button variant="outline" size="sm" type="button" onClick={refresh} disabled={refreshing}>
        {refreshing ? 'Checking…' : `Re-check network`}
      </Button>
    </section>
  );
}
