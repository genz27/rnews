import { HomeView } from '@/components/HomeView';
import { filterItems, fetchAllFeeds, ensureBackgroundRefresh } from '@/lib/rss';
import { hydrateTranslations } from '@/lib/translate';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 40;

export default async function Page() {
  ensureBackgroundRefresh();
  const snapshot = await fetchAllFeeds();
  const translated = await hydrateTranslations(filterItems(snapshot.items, '推荐'), { immediate: 40 });

  return (
    <HomeView
      initialItems={translated.slice(0, PAGE_SIZE)}
      initialTotal={translated.length}
      initialHasMore={translated.length > PAGE_SIZE}
      initialStats={{
        sources: snapshot.sources,
        ok: snapshot.ok,
        failed: snapshot.failed,
      }}
      initialCachedAt={snapshot.time}
    />
  );
}
