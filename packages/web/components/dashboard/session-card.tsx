'use client';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useWallet } from '@/providers/wallet-provider';
import { useSignIn, useSignOut } from '@/services/auth';

function shortAddr(a: string): string {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

/**
 * Wallet-signature session gate (D-001). Connecting Freighter is not a session — the API's
 * `kmf_session` cookie is what `POST /content/upload`, `/confirm`, and `GET /:id/download`
 * require. This turns a connected wallet into a signed-in session (challenge → signMessage →
 * verify). Rendered by `DashboardShell`; the panels below it only appear once `me` resolves.
 */
export function SignInCard({
  onSignedIn,
}: {
  onSignedIn?: () => void;
}) {
  const { address } = useWallet();
  const signIn = useSignIn();

  async function handle() {
    await signIn.mutateAsync();
    onSignedIn?.();
  }

  return (
    <section className="card center">
      <span className="label">Step 2 of 2</span>
      <p style={{ margin: '6px 0 4px', fontWeight: 600 }}>Sign in to your account</p>
      <p className="hint" style={{ marginTop: 0 }}>
        Your wallet is connected. Now sign one message to start a secure session. This is how you
        open content and publish. No gas, no password.
      </p>
      <Button type="button" onClick={handle} disabled={signIn.isPending || !address}>
        <Icon name="pen" size={15} />
        {signIn.isPending ? 'Check your wallet…' : 'Sign in'}
      </Button>
      {signIn.isError ? (
        <p className="error" style={{ marginBottom: 0 }}>
          {signIn.error instanceof Error ? signIn.error.message : 'Sign-in was cancelled or failed. Try again.'}
        </p>
      ) : null}
    </section>
  );
}

/** Compact "signed in as G…XXXX · Sign out" row for the header once a session exists. */
export function SessionBadge() {
  const { address, disconnect } = useWallet();
  const signOut = useSignOut();

  // Sign out is the single "leave" action: end the API session, then drop the wallet
  // connection too, so the user isn't left in a half-connected state (D-001).
  async function handle() {
    await signOut.mutateAsync();
    disconnect();
  }

  if (!address) return null;
  return (
    <div className="row tight" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="label" style={{ display: 'inline-flex', gap: 5, alignItems: 'center', color: 'var(--color-content-success)' }}>
        <Icon name="check" size={13} /> Signed in · {shortAddr(address)}
      </span>
      <Button type="button" size="sm" variant="outline" onClick={handle} disabled={signOut.isPending}>
        <Icon name="sign-out" size={14} />
        Sign out
      </Button>
    </div>
  );
}
