'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@/providers/wallet-provider';

function truncate(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/**
 * Connect / connected wallet control, styled with the Komunify design system
 * classes (see DESIGN.md). Wallet logic lives in `useWallet()`.
 */
export function ConnectWalletButton() {
  const { isConnected, address, network, connecting, error, connect, disconnect } = useWallet();

  if (isConnected && address) {
    return (
      <div className="row">
        <span className="row tight" style={{ marginTop: 0 }}>
          <code title={address}>{truncate(address)}</code>
          {network ? <span className="pill ok">{network}</span> : null}
        </span>
        <Button variant="outline" size="sm" type="button" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button type="button" onClick={connect} disabled={connecting}>
        {connecting ? 'Connecting…' : 'Connect Freighter'}
      </Button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
