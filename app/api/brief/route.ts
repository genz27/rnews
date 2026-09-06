import { NextRequest, NextResponse } from 'next/server';
import { BRIEF_TTL_MS, getDailyBrief } from '@/lib/brief';
import { attachRateLimitHeaders, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const blocked = rateLimit(request, { limit: 30, name: 'brief' });
  if (blocked) return blocked;

  try {
    const refresh = request.nextUrl.searchParams.get('refresh') === '1';
    const brief = await getDailyBrief({ refresh });
    const maxAge = Math.floor(BRIEF_TTL_MS / 1000);
    const response = NextResponse.json(brief, {
      headers: {
        'Cache-Control': refresh
          ? 'no-store'
          : `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge}`,
      },
    });
    return attachRateLimitHeaders(response, request, { limit: 30, name: 'brief' });
  } catch (error) {
    console.error('brief failed:', error);
    return NextResponse.json({ error: '日报暂时不可用' }, { status: 500 });
  }
}
