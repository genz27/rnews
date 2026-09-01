import { NextRequest, NextResponse } from 'next/server';
import { getCatalogCategories } from '@/lib/catalog';
import { getSources } from '@/lib/rss';
import { attachRateLimitHeaders, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const revalidate = 1800;

const RATE_LIMIT = 120;

export async function GET(request: NextRequest) {
  const blocked = rateLimit(request, { limit: RATE_LIMIT, name: 'site' });
  if (blocked) return blocked;

  try {
    const sources = await getSources();
    const response = NextResponse.json({
      categories: getCatalogCategories(),
      sourceCount: sources.length,
    });
    return attachRateLimitHeaders(response, request, { limit: RATE_LIMIT, name: 'site' });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({
      categories: getCatalogCategories(),
      sourceCount: 0,
    });
  }
}
