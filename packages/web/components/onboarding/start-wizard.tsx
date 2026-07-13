'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SaveCommunityRequest } from '@komunify/shared';

import { BrandForm } from '@/components/dashboard/community-onboarding';
import { SignInCard } from '@/components/dashboard/session-card';
import { UploadStepper } from '@/components/dashboard/upload-stepper';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { IconName } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { OnboardingStepper } from './onboarding-stepper';
import { useWallet } from '@/providers/wallet-provider';
import { useMe } from '@/services/auth';
import { authKeys } from '@/services/auth/auth.queries';
import { useCommunity, useSaveCommunity } from '@/services/community';
import { useBecomeManager, useIsManager } from '@/services/manager';
import { managerKeys } from '@/services/manager/manager.queries';

const STEPS = ['Welcome', 'Brand', 'Publish'];

const BENEFITS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'coins',
    title: 'Earn on every read',
    body: 'Revenue is split across the content members actually open, so your best work earns the most.',
  },
  {
    icon: 'shield',
    title: 'Your work stays yours',
    body: 'Every file is fingerprinted on-chain. No one can swap it, copy it, or claim it as their own.',
  },
  {
    icon: 'wallet',
    title: 'Cash out anytime',
    body: 'Claim your earnings whenever you want, sent straight to your Stellar wallet. No middleman.',
  },
];

/**
 * Guided community setup on its own page (`/start`). Sits on top of the same gates as the
 * dashboard: a wallet must be connected and signed in (D-001) before the flow begins. Step 2
 * runs the D-011 self-serve path (become a manager on-chain, then persist the brand D-010);
 * step 3 celebrates and folds in the existing publish flow so a new manager can ship their
 * first piece without leaving the journey.
 */
export function StartWizard() {
  const { isConnected, address, connecting, error: walletError, connect } = useWallet();
  const me = useMe();
  const isManager = useIsManager();
  const community = useCommunity(address);
  const saveCommunity = useSaveCommunity(address);
  const becomeManager = useBecomeManager();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!me.data;

  async function handleCreate(brand: SaveCommunityRequest) {
    setError(null);
    setBusy(true);
    try {
      await becomeManager.mutateAsync(); // set_manager(self, true), user-signed (D-011)
      await saveCommunity.mutateAsync(brand); // PUT /community, is_manager now passes (D-010)
      await Promise.all([
        qc.invalidateQueries({ queryKey: managerKeys.isManager(address) }),
        qc.invalidateQueries({ queryKey: authKeys.me(address) }),
      ]);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your community. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // --- Gates: connect, then sign in, before the wizard proper (D-001). -----------------------
  if (!isConnected || !address) {
    return (
      <section className="card center">
        <p style={{ margin: '0 0 4px', fontWeight: 600, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <Icon name="wallet" size={16} /> Connect your wallet to begin
        </p>
        <p className="hint" style={{ marginTop: 0 }}>
          Your Stellar wallet is your account here. No email, no password. Connect Freighter to
          start your community.
        </p>
        <Button type="button" onClick={connect} disabled={connecting}>
          {connecting ? 'Connecting…' : 'Connect Freighter'}
        </Button>
        {walletError ? <p className="error">{walletError}</p> : null}
      </section>
    );
  }

  if (me.isLoading || isManager.isLoading || community.isLoading) {
    return (
      <section className="card">
        <Skeleton className="h-24 w-full rounded-md" />
      </section>
    );
  }

  if (!isAuthenticated) {
    return <SignInCard />;
  }

  // Fully set-up manager on arrival (step 0): don't re-run onboarding. We require a saved brand
  // too, so a legacy manager without one still falls through to the flow to finish it (otherwise
  // they'd bounce between here and the dashboard's "finish setup" nudge). Once the flow itself
  // flips the role (step > 0), this guard is skipped so the live step still renders.
  if (isManager.data && community.data && step === 0) {
    return (
      <section className="card center">
        <p style={{ margin: '0 0 4px', fontWeight: 600, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <Icon name="check" size={16} /> You already run a community
        </p>
        <p className="hint" style={{ marginTop: 0 }}>
          Publish new content, edit your brand, and claim earnings from your dashboard.
        </p>
        <div className="row tight" style={{ justifyContent: 'center' }}>
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/community/${address}`} target="_blank" rel="noreferrer">
              View my page
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  const brand = community.data ?? null;

  return (
    <>
      <header style={{ marginBottom: 0 }}>
        <span className="label">Start a community</span>
        <div style={{ marginTop: 'var(--space-3)' }}>
          <OnboardingStepper steps={STEPS} current={step} />
        </div>
      </header>

      {step === 0 ? (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Get paid for what you publish</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            Share your best PDFs and earn every time a member opens one. Your payouts land straight
            in your wallet. It is free to start and takes about a minute.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', margin: 'var(--space-4) 0' }}>
            {BENEFITS.map((b) => (
              <div key={b.title} className="benefit">
                <span className="benefit-icon">
                  <Icon name={b.icon} size={18} />
                </span>
                <div>
                  <p className="benefit-title">{b.title}</p>
                  <p className="benefit-body">{b.body}</p>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" onClick={() => setStep(1)}>
            <Icon name="sparkle" size={15} /> Create my community
          </Button>
          <p className="hint" style={{ margin: 'var(--space-3) 0 0' }}>
            Free to start. You will sign one quick transaction to claim your community on-chain.
          </p>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Name your community</h2>
          <BrandForm
            initial={null}
            saving={busy}
            error={error}
            onSave={handleCreate}
            onCancel={() => setStep(0)}
            submitLabel="Create my community"
            savingLabel="Check your wallet…"
          />
        </section>
      ) : null}

      {step === 2 ? (
        <>
          <section className="card">
            <p className="success" style={{ marginTop: 0, display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
              <Icon name="check" size={16} /> You are live
            </p>
            <p style={{ margin: '0 0 4px', fontWeight: 700 }}>
              {brand?.name ?? 'Your community'} is now on komunify.
            </p>
            <p className="hint" style={{ marginTop: 0 }}>
              Add your first piece below so members have something to unlock. You can publish more
              anytime from your dashboard.
            </p>
            {address ? (
              <Link href={`/community/${address}`} target="_blank" rel="noreferrer" className="explorer-link">
                View your public page →
              </Link>
            ) : null}
          </section>

          <UploadStepper />

          <div className="center">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Go to dashboard →</Link>
            </Button>
          </div>
        </>
      ) : null}
    </>
  );
}
