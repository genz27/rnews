import { NextRequest } from 'next/server';
import { corsOptions, jsonApi } from '@/lib/public-api';
import { rateLimit, attachRateLimitHeaders } from '@/lib/rate-limit';
import { getCatalogCategories } from '@/lib/catalog';
import { getSources } from '@/lib/rss';

export const dynamic = 'force-dynamic';

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

  const sources = await getSources().catch(() => []);
  const response = jsonApi({
    ok: true,
    categories: getCatalogCategories(),
    sourceCount: sources.length,
  });
  return attachRateLimitHeaders(response, request, { limit: LIMIT, name: 'v1' });
}
