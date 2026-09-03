import { after } from 'next/server';
import { cookies } from 'next/headers';
import { HomeView } from '@/components/HomeView';
import { CATEGORY_COOKIE, readCategoryCookie } from '@/lib/category-pref';
import { getCatalogCategories } from '@/lib/catalog';
import { compactFeedPages } from '@/lib/feed-bootstrap';
import { buildInitialPages, buildPage, pageKey } from '@/lib/feed-page';
import { ensureBackgroundRefresh, fetchAllFeeds, scheduleFeedRefresh } from '@/lib/rss';

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
  after(() => scheduleFeedRefresh());

  const initialPages = buildInitialPages(snapshot.items, Date.now());
  if (query) {
    initialPages[pageKey(category, query)] = buildPage(snapshot.items, category, query);
  }
  const stats = {
    sources: snapshot.sources,
    ok: snapshot.ok,
    failed: snapshot.failed,
  };
  const bootstrap = compactFeedPages(initialPages, snapshot.time, stats);

  return (
    <HomeView
      initialBootstrap={bootstrap}
      initialCategory={category}
      initialQuery={query}
      initialCachedAt={snapshot.time}
    />
  );
}
