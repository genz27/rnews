import { after } from 'next/server';
import { redirect } from 'next/navigation';
import { HomeView } from '@/components/HomeView';
import { getCatalogCategories } from '@/lib/catalog';
import { compactFeedPages } from '@/lib/feed-bootstrap';
import { buildInitialPages, buildPage, pageKey } from '@/lib/feed-page';
import { ensureBackgroundRefresh, fetchAllFeeds, scheduleFeedRefresh } from '@/lib/rss';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type PageProps = {
  searchParams: Promise<{ c?: string; q?: string; ask?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const ask = (params.ask || '').trim();
  if (ask) redirect(`/ask?q=${encodeURIComponent(ask)}`);

  const categories = getCatalogCategories();
  const fromUrl = categories.includes(params.c || '') ? (params.c as string) : '';
  const query = (params.q || '').trim();
  const view = !fromUrl && !query ? '首页' : fromUrl || '推荐';
  const category = view === '首页' ? '全部' : fromUrl || '推荐';

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
      initialCategory={view}
      initialQuery={query}
      initialCachedAt={snapshot.time}
    />
  );
}
