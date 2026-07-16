import { AppShell } from '@/components/app-shell/app-shell';
import { ExploreView } from '@/components/explore/explore-view';

/** Public discovery page: browse communities or all published content. */
export default function ExplorePage() {
  return (
    <AppShell><main className="shell"><ExploreView /></main></AppShell>
  );
}
