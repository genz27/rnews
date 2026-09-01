'use client';

import type { FeedBootstrap } from './types';

const CACHE_NAME = 'rnews-feed-v2';
const LEGACY_CACHE_NAMES = ['rnews-feed-v1'];
const SNAPSHOT_URL = '/__rnews_feed_snapshot__';

function hasMojibake(text: string): boolean {
  return (text.match(/\uFFFD/g) || []).length >= 2;
}

function valid(value: unknown): value is FeedBootstrap {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FeedBootstrap>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.items) &&
    Boolean(candidate.pages && typeof candidate.pages === 'object') &&
    !candidate.items.some((item) => hasMojibake(item?.title || ''))
  );
}

export async function readBrowserFeed(): Promise<FeedBootstrap | null> {
  if (!('caches' in window)) return null;
  try {
    await Promise.all(LEGACY_CACHE_NAMES.map((name) => caches.delete(name).catch(() => false)));
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(SNAPSHOT_URL);
    if (!response) return null;
    const value = (await response.json()) as unknown;
    return valid(value) ? value : null;
  } catch {
    return null;
  }
}

export async function writeBrowserFeed(snapshot: FeedBootstrap): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      SNAPSHOT_URL,
      new Response(JSON.stringify(snapshot), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch {
    // Private browsing and strict storage settings can reject Cache Storage.
  }
}
