import { NextRequest, NextResponse } from 'next/server';

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 8000;

function prune(now: number) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size < MAX_KEYS / 2) break;
  }
}

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || request.headers.get('cf-connecting-ip')?.trim() || 'unknown';
}

export function rateLimit(
  request: NextRequest,
  options: { limit: number; windowMs?: number; name?: string }
): NextResponse | null {
  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();
  prune(now);

  const key = `${options.name ?? 'api'}:${clientIp(request)}`;
  const existing = buckets.get(key);
  const bucket =
    !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;
  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(0, options.limit - bucket.count);
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const headers = {
    'X-RateLimit-Limit': String(options.limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
  };

  if (bucket.count > options.limit) {
    return NextResponse.json(
      {
        ok: false,
        error: '请求过于频繁，请稍后再试',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': String(retryAfter),
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  return null;
}

export function attachRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
  options: { limit: number; name?: string }
) {
  const key = `${options.name ?? 'api'}:${clientIp(request)}`;
  const bucket = buckets.get(key);
  if (bucket) {
    response.headers.set('X-RateLimit-Limit', String(options.limit));
    response.headers.set(
      'X-RateLimit-Remaining',
      String(Math.max(0, options.limit - bucket.count))
    );
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
  }
  return response;
}
