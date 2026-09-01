import { NextRequest, NextResponse } from 'next/server';
import { fetchAllFeeds } from '@/lib/rss';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get('authorization') || '';
    const query = request.nextUrl.searchParams.get('secret') || '';
    if (header !== `Bearer ${secret}` && query !== secret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const snapshot = await fetchAllFeeds({ force: true });
  return NextResponse.json({
    ok: true,
    total: snapshot.items.length,
    sources: snapshot.sources,
    succeeded: snapshot.ok,
    failed: snapshot.failed,
    cachedAt: snapshot.time,
  });
}
