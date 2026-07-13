'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/**
 * Dashboard nudge for a signed-in wallet that isn't a manager yet. The actual self-serve setup
 * (become a manager on-chain D-011, save the brand D-010, publish first content) is a guided
 * flow on its own page, `/start` (see `StartWizard`). This card just sells it and links across.
 */
export function StartCommunityCard() {
  return (
    <section className="card center">
      <h2 style={{ marginTop: 0 }}>Have something worth reading?</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        Publish your PDFs, and earn every time a member opens them. Your payouts go straight to your
        wallet. It is free to start and takes about a minute.
      </p>
      <Button asChild>
        <Link href="/start">
          <Icon name="sparkle" size={15} /> Start your community
        </Link>
      </Button>
    </section>
  );
}
