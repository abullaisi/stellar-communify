import { CommunityView } from '@/components/community/community-view';

/** Public per-community page: /community/<manager wallet>. */
export default async function CommunityPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  return (
    <main className="shell">
      <CommunityView address={address} />
    </main>
  );
}
