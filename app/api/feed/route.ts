import { NextRequest, NextResponse } from 'next/server';
import { fetchAllFeeds, filterItems, pickRandomItems } from '@/lib/rss';
import { hydrateTranslations } from '@/lib/translate';
import { FeedResponse } from '@/lib/types';
import { attachRateLimitHeaders, rateLimit } from '@/lib/rate-limit';

const ITEMS_PER_PAGE = 40;
const RATE_LIMIT = 120;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const blocked = rateLimit(request, { limit: RATE_LIMIT, name: 'site' });
  if (blocked) return blocked;

  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = Math.max(0, parseInt(searchParams.get('cursor') || '0', 10) || 0);
    const category = searchParams.get('category') || '';
    const query = searchParams.get('q') || '';
    const force = searchParams.get('refresh') === '1';
    const seed = searchParams.get('seed') || String(Date.now());
    const exclude = (searchParams.get('exclude') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const snapshot = await fetchAllFeeds({ force });
    const pool = filterItems(snapshot.items, category, query);
    const recommend = category === '推荐' && !query;

    const page = recommend
      ? pickRandomItems(pool, ITEMS_PER_PAGE, seed, exclude)
      : pool.slice(cursor, cursor + ITEMS_PER_PAGE);
    const paginatedItems = await hydrateTranslations(page, { immediate: ITEMS_PER_PAGE });
    const hasMore = recommend ? pool.length > 0 : cursor + ITEMS_PER_PAGE < pool.length;

    const response: FeedResponse = {
      items: paginatedItems,
      hasMore,
      nextCursor: recommend ? cursor + paginatedItems.length : hasMore ? cursor + ITEMS_PER_PAGE : undefined,
      total: pool.length,
      stats: {
        sources: snapshot.sources,
        ok: snapshot.ok,
        failed: snapshot.failed,
      },
      cachedAt: snapshot.time,
    };

    const json = NextResponse.json(response, {
      headers: {
        'Cache-Control': recommend
          ? 'no-store'
          : 'public, s-maxage=60, stale-while-revalidate=600',
      },
    });
    return attachRateLimitHeaders(json, request, { limit: RATE_LIMIT, name: 'site' });
  } catch (error) {
    console.error('Error in feed API:', error);
    return NextResponse.json(
      { error: '订阅源暂时不可用，请稍后重试', items: [], hasMore: false, total: 0 },
      { status: 500 }
    );
  }
}
