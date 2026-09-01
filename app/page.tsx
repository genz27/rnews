import { after } from 'next/server';
import { HomeView } from '@/components/HomeView';
import { getCatalogCategories } from '@/lib/catalog';
import { ensureBackgroundRefresh, fetchAllFeeds, filterItems, pickRandomItems, scheduleFeedRefresh } from '@/lib/rss';
import { hydrateTranslations } from '@/lib/translate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PAGE_SIZE = 40;

type PageProps = {
  searchParams: Promise<{ c?: string; q?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const categories = getCatalogCategories();
  const category = categories.includes(params.c || '') ? (params.c as string) : '推荐';
  const query = (params.q || '').trim();

  ensureBackgroundRefresh();
  const snapshot = await fetchAllFeeds();
  after(() => scheduleFeedRefresh());
  const pool = filterItems(snapshot.items, category, query);
  const firstPage =
    category === '推荐' && !query
      ? pickRandomItems(pool, PAGE_SIZE, Date.now())
      : pool.slice(0, PAGE_SIZE);
  const translated = await hydrateTranslations(firstPage, { immediate: PAGE_SIZE });
  const hasMore = category === '推荐' && !query ? pool.length > 0 : pool.length > PAGE_SIZE;

  return (
    <HomeView
      initialItems={translated}
      initialTotal={pool.length}
      initialHasMore={hasMore}
      initialCategory={category}
      initialQuery={query}
      initialStats={{
        sources: snapshot.sources,
        ok: snapshot.ok,
        failed: snapshot.failed,
      }}
      initialCachedAt={snapshot.time}
    />
  );
}
