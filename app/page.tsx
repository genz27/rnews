import { HomeView } from '@/components/HomeView';
import { filterItems, fetchAllFeeds, ensureBackgroundRefresh } from '@/lib/rss';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 40;

export default async function Page() {
  ensureBackgroundRefresh();
  const snapshot = await fetchAllFeeds();
  const items = filterItems(snapshot.items);

  return (
    <HomeView
      initialItems={items.slice(0, PAGE_SIZE)}
      initialTotal={items.length}
      initialHasMore={items.length > PAGE_SIZE}
      initialStats={{
        sources: snapshot.sources,
        ok: snapshot.ok,
        failed: snapshot.failed,
      }}
      initialCachedAt={snapshot.time}
    />
  );
}
