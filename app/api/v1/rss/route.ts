import { NextRequest, NextResponse } from 'next/server';
import {
  CORS_HEADERS,
  corsOptions,
  filterSince,
  parseLimit,
  parseSince,
  siteOrigin,
  toRssXml,
} from '@/lib/public-api';
import { attachRateLimitHeaders, rateLimit } from '@/lib/rate-limit';
import { fetchAllFeeds, filterItems } from '@/lib/rss';
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
    const category = request.nextUrl.searchParams.get('category') || '全部';
    const query = request.nextUrl.searchParams.get('q') || '';
    const limit = parseLimit(request.nextUrl.searchParams.get('limit'), 50, 100);
    const since = parseSince(request.nextUrl.searchParams.get('since'));
    if (!since.ok) {
      return NextResponse.json(
        { ok: false, error: 'since 不是有效时间' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    const origin = siteOrigin(request);

    const snapshot = await fetchAllFeeds();
    const pool = filterSince(
      filterItems(snapshot.items, category, query).sort(
        (a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate)
      ),
      since.ms
    );
    const items = pool.slice(0, limit).map((item) => applyTranslation(item));
    const label = category && category !== '全部' ? `Rnews · ${category}` : 'Rnews';
    const xml = toRssXml(items, {
      title: label,
      link: origin,
      description: query ? `Rnews 聚合结果：${query}` : '技术社区、AI、资讯、工程与主机的 RSS 聚合。',
    });

    const response = new NextResponse(xml, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    });
    return attachRateLimitHeaders(response, request, { limit: LIMIT, name: 'v1' });
  } catch (error) {
    console.error('public rss API failed:', error);
    return NextResponse.json(
      { ok: false, error: '订阅源暂时不可用' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
