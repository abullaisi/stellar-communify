'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { ContentService, contentKeys } from '@/services/content';
import { useCommunities } from '@/services/community';

type Mode = 'communities' | 'content';

/**
 * Explore (public, no wallet): two modes — browse communities (those with published content,
 * richest first) and browse all published content. Opening/reading still happens on the dashboard
 * where the subscription + read-recording flow lives; this page is discovery only.
 */
export function ExploreView() {
  const [mode, setMode] = useState<Mode>('communities');

  return (
    <>
      <header>
        <p className="tagline" style={{ marginTop: 0 }}>
          Discover communities. Unlock their libraries with one subscription.
        </p>
      </header>

      <div className="card">
        <div className="row tight">
          <button
            type="button"
            className={mode === 'communities' ? 'pill accent' : 'pill'}
            onClick={() => setMode('communities')}
          >
            <Icon name="users" size={12} /> Communities
          </button>
          <button
            type="button"
            className={mode === 'content' ? 'pill accent' : 'pill'}
            onClick={() => setMode('content')}
          >
            <Icon name="sparkle" size={12} /> Content
          </button>
        </div>
      </div>

      {mode === 'communities' ? <CommunitiesTab /> : <ContentTab />}

      <p className="hint" style={{ textAlign: 'center' }}>
        <Link href="/dashboard">Go to your dashboard →</Link>
      </p>
    </>
  );
}

function CommunitiesTab() {
  const communities = useCommunities();
  const items = communities.data?.communities ?? [];

  if (communities.isLoading) {
    return (
      <section className="card">
        <Skeleton className="h-16 w-full rounded-md" />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="card center">
        <p className="hint" style={{ margin: 0, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <Icon name="users" size={15} />
          No communities yet. Be the first to start one from your dashboard.
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Communities</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((c) => (
          <Link
            key={c.wallet}
            href={`/community/${c.wallet}`}
            className="row"
            style={{
              alignItems: 'center',
              paddingBottom: 12,
              borderBottom: '1px solid var(--color-border-medium)',
              textDecoration: 'none',
            }}
          >
            <div className="row tight" style={{ alignItems: 'center' }}>
              {c.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.logo}
                  alt={`${c.name} logo`}
                  style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
                />
              ) : null}
              <div>
                <p style={{ margin: 0, fontWeight: 700 }}>{c.name}</p>
                {c.description ? <span className="label">{c.description}</span> : null}
              </div>
            </div>
            <span className="pill">
              {c.contentCount} {c.contentCount === 1 ? 'item' : 'items'}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ContentTab() {
  const content = useQuery({
    queryKey: [...contentKeys.all(null), 'explore'],
    queryFn: () => ContentService.list(),
  });
  const items = content.data?.items ?? [];

  if (content.isLoading) {
    return (
      <section className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="card center">
        <p className="hint" style={{ margin: 0, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <Icon name="sparkle" size={15} />
          No content published yet. Check back soon.
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Latest content</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.contentId}
            className="row"
            style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-border-medium)' }}
          >
            <div>
              <p style={{ margin: 0 }}>{item.title}</p>
              {item.description ? <span className="label">{item.description}</span> : null}
              <div style={{ marginTop: 4 }}>
                <Link href={`/community/${item.creatorWallet}`} className="label">
                  View community →
                </Link>
              </div>
            </div>
            <span className="label">#{item.contentId}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
