import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 86400;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host === '::1' || host === '0.0.0.0') return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  if (!raw) {
    return new Response('missing url', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return new Response('bad url', { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || isPrivateHost(parsed.hostname)) {
    return new Response('blocked url', { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: { 'User-Agent': USER_AGENT, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!upstream.ok) {
      return new Response(null, { status: 502 });
    }
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    if (!contentType.startsWith('image/')) {
      return new Response(null, { status: 415 });
    }
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
