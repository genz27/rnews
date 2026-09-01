import { after } from 'next/server';
import { cookies } from 'next/headers';
import { HomeView } from '@/components/HomeView';
import { CATEGORY_COOKIE, readCategoryCookie } from '@/lib/category-pref';
import { getCatalogCategories } from '@/lib/catalog';
import { buildInitialPages, buildPage, pageKey } from '@/lib/feed-page';
import { ensureBackgroundRefresh, fetchAllFeeds, scheduleFeedRefresh, scheduleMissingTranslations } from '@/lib/rss';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type PageProps = {
  searchParams: Promise<{ c?: string; q?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const categories = getCatalogCategories();
  const cookieStore = await cookies();
  const fromUrl = categories.includes(params.c || '') ? (params.c as string) : '';
  const fromCookie = readCategoryCookie(cookieStore.get(CATEGORY_COOKIE)?.value, categories);
  const category = fromUrl || fromCookie || '推荐';
  const query = (params.q || '').trim();

  ensureBackgroundRefresh();
  const snapshot = await fetchAllFeeds();
  after(async () => {
    scheduleFeedRefresh();
    await scheduleMissingTranslations();
  });

  const initialPages = buildInitialPages(snapshot.items, snapshot.time || Date.now());
  if (query) {
    initialPages[pageKey(category, query)] = buildPage(snapshot.items, category, query);
  }

  const active =
    initialPages[pageKey(category, query)] ||
    initialPages[pageKey(category)] ||
    initialPages[pageKey('推荐')] || {
      items: [],
      hasMore: false,
      total: 0,
      cursor: 0,
    };

  return (
    <HomeView
      initialPages={initialPages}
      initialItems={active.items}
      initialTotal={active.total}
      initialHasMore={active.hasMore}
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
