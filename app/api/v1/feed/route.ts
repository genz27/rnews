import { after, NextRequest } from 'next/server';
import {
  corsOptions,
  filterSince,
  jsonApi,
  newestPubDate,
  parseCursor,
  parseLimit,
  parseSince,
} from '@/lib/public-api';
import { rateLimit, attachRateLimitHeaders } from '@/lib/rate-limit';
import { fetchAllFeeds, filterItems, scheduleMissingTranslations } from '@/lib/rss';
import { applyTranslation } from '@/lib/translate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const LIMIT = 60;

export function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  const blocked = rateLimit(request, { limit: LIMIT, name: 'v1' });
  if (blocked) {
    blocked.headers.set('Access-Control-Allow-Origin', '*');
    return blocked;
  }

  try {
    const search = request.nextUrl.searchParams;
    const category = search.get('category') || '全部';
    const query = search.get('q') || '';
    const cursor = parseCursor(search.get('cursor'));
    const limit = parseLimit(search.get('limit'));
    const since = parseSince(search.get('since'));
    if (!since.ok) {
      return jsonApi({ ok: false, error: 'since 不是有效时间' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    const snapshot = await fetchAllFeeds();
    after(() => scheduleMissingTranslations());
    const pool = filterSince(
      filterItems(snapshot.items, category, query).sort(
        (a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate)
      ),
      since.ms
    );
    const page = pool.slice(cursor, cursor + limit);
    const items = page.map((item) => applyTranslation(item));
    const hasMore = cursor + limit < pool.length;
    const sinceIso = since.ms != null ? new Date(since.ms).toISOString() : null;

    const response = jsonApi({
      ok: true,
      items,
      total: pool.length,
      limit,
      cursor,
      nextCursor: hasMore ? cursor + limit : null,
      hasMore,
      category,
      query: query || null,
      since: sinceIso,
      newestPubDate: newestPubDate(items) || newestPubDate(pool),
      cachedAt: snapshot.time,
    });
    return attachRateLimitHeaders(response, request, { limit: LIMIT, name: 'v1' });
  } catch (error) {
    console.error('public feed API failed:', error);
    return jsonApi({ ok: false, error: '订阅源暂时不可用' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
