'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useWallet } from '@/providers/wallet-provider';
import { useMe, useSignOut } from '@/services/auth';

function truncate(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

/**
 * Single wallet control for the sticky app bar. Replaces the old ConnectWalletButton +
 * SessionBadge pair (which showed the address twice). Three states:
 *  - not connected: Connect button
 *  - connected, no session: address + Disconnect (sign-in is the body's Step 2 card)
 *  - signed in: a green-checked address + Sign out
 */
export function WalletControl() {
  const { isConnected, address, connecting, error, connect, disconnect } = useWallet();
  const me = useMe();
  const signOut = useSignOut();
  const isAuthed = !!me.data;

  if (!isConnected || !address) {
    return (
      <div className="app-bar-wallet">
        <Button type="button" size="sm" onClick={connect} disabled={connecting}>
          <Icon name="wallet" size={14} />
          {connecting ? 'Connecting…' : 'Connect'}
        </Button>
        {error ? <span className="error" style={{ margin: 0, fontSize: 12 }}>{error}</span> : null}
      </div>
    );
  }

  async function handleSignOut() {
    await signOut.mutateAsync();
    disconnect();
  }

  return (
    <div className="app-bar-wallet">
      <code
        title={address}
        style={
          isAuthed
            ? { display: 'inline-flex', gap: 4, alignItems: 'center', color: 'var(--color-content-success)' }
            : undefined
        }
      >
        {isAuthed ? <Icon name="check" size={12} /> : null}
        {truncate(address)}
      </code>
      {isAuthed ? (
        <Button type="button" variant="outline" size="sm" onClick={handleSignOut} disabled={signOut.isPending}>
          <Icon name="sign-out" size={14} />
          Sign out
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      )}
    </div>
  );
}
