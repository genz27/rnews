import { NextRequest, NextResponse } from 'next/server';
import { FeedItem } from '@/lib/types';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function corsOptions() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export function jsonApi(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      ...init?.headers,
    },
  });
}

export function parseLimit(raw: string | null, fallback = 40, max = 100) {
  const value = parseInt(raw || '', 10);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(max, value);
}

export function parseCursor(raw: string | null) {
  const value = parseInt(raw || '0', 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function parseSince(raw: string | null): { ok: true; ms: number | null } | { ok: false } {
  if (!raw || !raw.trim()) return { ok: true, ms: null };
  const value = raw.trim();
  if (/^\d+$/.test(value)) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return { ok: false };
    return { ok: true, ms: n < 1e12 ? n * 1000 : n };
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return { ok: false };
  return { ok: true, ms: parsed };
}

export function filterSince(items: FeedItem[], sinceMs: number | null): FeedItem[] {
  if (sinceMs == null) return items;
  return items.filter((item) => {
    const time = Date.parse(item.pubDate);
    return Number.isFinite(time) && time > sinceMs;
  });
}

export function newestPubDate(items: FeedItem[]): string | null {
  let newest = 0;
  let iso: string | null = null;
  for (const item of items) {
    const time = Date.parse(item.pubDate);
    if (Number.isFinite(time) && time > newest) {
      newest = time;
      iso = new Date(time).toISOString();
    }
  }
  return iso;
}

export function siteOrigin(request: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
}

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function toRssXml(items: FeedItem[], options: { title: string; link: string; description: string }) {
  const rows = items
    .map((item) => {
      const title = xmlEscape(item.titleZh || item.title);
      const date = Number.isNaN(Date.parse(item.pubDate)) ? new Date().toUTCString() : new Date(item.pubDate).toUTCString();
      const snippet = item.snippet ? `\n      <description>${xmlEscape(item.snippet)}</description>` : '';
      return `    <item>
      <title>${title}</title>
      <link>${xmlEscape(item.link)}</link>
      <guid isPermaLink="false">${xmlEscape(item.id)}</guid>
      <pubDate>${date}</pubDate>
      <category>${xmlEscape(item.category)}</category>
      <source>${xmlEscape(item.source)}</source>${snippet}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(options.title)}</title>
    <link>${xmlEscape(options.link)}</link>
    <description>${xmlEscape(options.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rows}
  </channel>
</rss>
`;
}
