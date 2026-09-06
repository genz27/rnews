import { after } from 'next/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { BriefHome } from '@/components/BriefHome';
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

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  if ((params.ask || '').trim()) return { title: 'Rnews' };
  const categories = getCatalogCategories();
  const fromUrl = categories.includes(params.c || '') ? params.c : '';
  const query = (params.q || '').trim();
  if (!fromUrl && !query) {
    return { title: '今日日报 · Rnews', description: '半日新闻摘要' };
  }
  return { title: 'Rnews', description: '聚合技术社区、AI、科技媒体与主机资讯。' };
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const ask = (params.ask || '').trim();
  if (ask) redirect(`/ask?q=${encodeURIComponent(ask)}`);

  const categories = getCatalogCategories();
  const fromUrl = categories.includes(params.c || '') ? (params.c as string) : '';
  const query = (params.q || '').trim();
  if (!fromUrl && !query) return <BriefHome />;

  const view = fromUrl || '推荐';
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

  return (
    <HomeView
      initialBootstrap={bootstrap}
      initialCategory={view}
      initialQuery={query}
      initialCachedAt={snapshot.time}
    />
  );
}
