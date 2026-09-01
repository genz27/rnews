import { NextRequest, NextResponse } from 'next/server';
import { fetchAllFeeds, filterItems } from '@/lib/rss';
import { FeedResponse } from '@/lib/types';

const ITEMS_PER_PAGE = 24;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = Math.max(0, parseInt(searchParams.get('cursor') || '0', 10) || 0);
    const category = searchParams.get('category') || '';
    const query = searchParams.get('q') || '';
    const force = searchParams.get('refresh') === '1';

    const snapshot = await fetchAllFeeds({ force });
    const items = filterItems(snapshot.items, category, query);

    const endIndex = cursor + ITEMS_PER_PAGE;
    const paginatedItems = items.slice(cursor, endIndex);
    const hasMore = endIndex < items.length;

    const response: FeedResponse = {
      items: paginatedItems,
      hasMore,
      nextCursor: hasMore ? endIndex : undefined,
      total: items.length,
      stats: {
        sources: snapshot.sources,
        ok: snapshot.ok,
        failed: snapshot.failed,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in feed API:', error);
    return NextResponse.json(
      { error: '订阅源暂时不可用，请稍后重试', items: [], hasMore: false, total: 0 },
      { status: 500 }
    );
  }
}
