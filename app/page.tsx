import { after } from 'next/server';
import { HomeView } from '@/components/HomeView';
import { getCatalogCategories } from '@/lib/catalog';
import { compactFeedPages } from '@/lib/feed-bootstrap';
import { buildInitialPages, buildPage, pageKey } from '@/lib/feed-page';
import { readCachedBrief } from '@/lib/brief';
import { ensureBackgroundRefresh, fetchAllFeeds, scheduleFeedRefresh } from '@/lib/rss';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type PageProps = {
  searchParams: Promise<{ c?: string; q?: string; ask?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const categories = getCatalogCategories();
  const ask = (params.ask || '').trim();
  const fromUrl = categories.includes(params.c || '') ? (params.c as string) : '';
  const query = ask ? '' : (params.q || '').trim();
  const view = ask || (!fromUrl && !query) ? '首页' : fromUrl || '推荐';
  const category = fromUrl || '推荐';

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
  const initialBrief = await readCachedBrief();

  return (
    <HomeView
      initialBootstrap={bootstrap}
      initialCategory={view}
      initialQuery={query}
      initialAsk={ask}
      initialBrief={initialBrief}
      initialCachedAt={snapshot.time}
    />
  );
}
