import { HomeView } from '@/components/HomeView';
import { ensureBackgroundRefresh, fetchAllFeeds, filterItems, pickRandomItems } from '@/lib/rss';
import { hydrateTranslations } from '@/lib/translate';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 40;

export default async function Page() {
  ensureBackgroundRefresh();
  const snapshot = await fetchAllFeeds();
  const recommended = filterItems(snapshot.items, '推荐');
  const firstPage = pickRandomItems(recommended, PAGE_SIZE, Date.now());
  const translated = await hydrateTranslations(firstPage, { immediate: PAGE_SIZE });

  return (
    <HomeView
      initialItems={translated}
      initialTotal={recommended.length}
      initialHasMore={recommended.length > 0}
      initialStats={{
        sources: snapshot.sources,
        ok: snapshot.ok,
        failed: snapshot.failed,
      }}
      initialCachedAt={snapshot.time}
    />
  );
}
