'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Skeleton } from '@/components/ui/skeleton';
import { ContentService } from '@/services/content';
import { contentKeys } from '@/services/content';
import { useCommunity } from '@/services/community';

/**
 * Public community page (TASK 2): logo, name, description, and the community's published content.
 * Read-only and unauthenticated — brand comes from the server (D-010), content from the public
 * `GET /content` list filtered to this creator. Opening/downloading still happens on the
 * dashboard, which is where the subscription + read-recording flow lives.
 */
export function CommunityView({ address }: { address: string }) {
  const community = useCommunity(address);
  const content = useQuery({
    queryKey: [...contentKeys.all(null), 'byCreator', address],
    queryFn: () => ContentService.list(),
  });

  const items = (content.data?.items ?? []).filter((c) => c.creatorWallet === address);
  const brand = community.data;

  return (
    <>
      <header>
        <h1 className="logo">komunify</h1>
        <p className="tagline">Community</p>
      </header>

      <section className="card">
        {community.isLoading ? (
          <Skeleton className="h-16 w-full rounded-md" />
        ) : brand ? (
          <div className="row tight" style={{ alignItems: 'center' }}>
            {brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logo}
                alt={`${brand.name} logo`}
                style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
              />
            ) : null}
            <div>
              <h2 style={{ margin: 0 }}>{brand.name}</h2>
              {brand.description ? (
                <p className="hint" style={{ margin: '4px 0 0' }}>
                  {brand.description}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="hint" style={{ margin: 0 }}>
            This community hasn’t set up a page yet.
          </p>
        )}
      </section>

      <section className="card">
        <h2>Content</h2>
        {content.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        ) : items.length > 0 ? (
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
                </div>
                <span className="label">#{item.contentId}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="hint">No published content yet.</p>
        )}
        <p className="hint" style={{ marginBottom: 0 }}>
          <Link href="/dashboard">Subscribe on the dashboard →</Link> to unlock and read.
        </p>
      </section>
    </>
  );
}
