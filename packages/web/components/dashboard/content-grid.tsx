'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/services/api/http';
import { useContentGrid, useHasRead, useOpenContent } from '@/services/content';
import type { ContentGridItem } from '@/services/content';
import { useSubscriptionStatus } from '@/services/subscription';

/** One content row: locked/unlocked badge + open button. Download flow, PLAN.md §2.
 *  The Open CTA (gold, the design system's one primary action) is reserved for content the
 *  member can actually unlock — i.e. an active subscription. While inactive it degrades to a
 *  secondary "Subscribe to open" so a locked row never wears a green-light button. */
function ContentRow({ item }: { item: ContentGridItem }) {
  const status = useSubscriptionStatus();
  const hasRead = useHasRead(item.contentId);
  const open = useOpenContent(item.contentId);
  const [notice, setNotice] = useState<string | null>(null);

  const isActive = status.data?.isActive ?? false;

  async function handleOpen() {
    setNotice(null);
    // No active subscription: don't fire a doomed download — point the member at the CTA above.
    if (!isActive) {
      setNotice('Become a member first (Membership card above) to open this.');
      return;
    }
    try {
      const res = await open.mutateAsync();
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'SUB_INACTIVE') {
        setNotice('Your membership isn’t active. Subscribe to open this.');
      } else if (e instanceof ApiError) {
        setNotice('Your read is recorded on-chain, but the file couldn’t be fetched just now. Try again in a moment.');
      } else {
        setNotice(e instanceof Error ? e.message : 'Couldn’t open this. Please try again.');
      }
    }
  }

  return (
    <div className="row" style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-border-medium)' }}>
      <div>
        <p style={{ margin: 0 }}>{item.title}</p>
        <span className="label">#{item.contentId}</span>
      </div>
      <div className="row tight" style={{ marginTop: 0 }}>
        {hasRead.data ? (
          <span className="pill accent">
            <Icon name="unlock" size={12} /> UNLOCKED
          </span>
        ) : (
          <span className="pill">
            <Icon name="lock" size={12} /> LOCKED
          </span>
        )}
        <Button
          type="button"
          size="sm"
          variant={isActive ? 'default' : 'outline'}
          onClick={handleOpen}
          disabled={open.isPending || status.isLoading}
        >
          {open.isPending ? (
            'Opening…'
          ) : isActive ? (
            <>
              <Icon name="download" size={14} /> Open
            </>
          ) : (
            'Subscribe to open'
          )}
        </Button>
      </div>
      {notice ? <p className="hint" style={{ gridColumn: '1 / -1' }}>{notice}</p> : null}
    </div>
  );
}

/** Content library grid (member panel). Reads from the chain — see `useContentGrid`. */
export function ContentGrid() {
  const grid = useContentGrid();

  return (
    <section className="card">
      <h2>Library</h2>
      {grid.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      ) : grid.data && grid.data.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {grid.data.map((item) => (
            <ContentRow key={item.contentId} item={item} />
          ))}
        </div>
      ) : (
        <p className="hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Icon name="sparkle" size={15} />
          Nothing here yet. New content shows up the moment a community publishes it.
        </p>
      )}
    </section>
  );
}
