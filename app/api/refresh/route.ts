import { NextRequest, NextResponse } from 'next/server';
import { fetchAllFeeds } from '@/lib/rss';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get('authorization') || '';
    const query = request.nextUrl.searchParams.get('secret') || '';
    if (header !== `Bearer ${secret}` && query !== secret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else {
    const blocked = rateLimit(request, { limit: 6, name: 'refresh' });
    if (blocked) return blocked;
  }

  const managedSnapshot = Boolean(process.env.VERCEL);
  const snapshot = await fetchAllFeeds({ wait: !managedSnapshot });
  return NextResponse.json({
    ok: true,
    mode: managedSnapshot ? 'repository-snapshot' : 'live-refresh',
    total: snapshot.items.length,
    sources: snapshot.sources,
    succeeded: snapshot.ok,
    failed: snapshot.failed,
    cachedAt: snapshot.time,
  });
}
