'use client';

import type { FeedBootstrap } from './types';

const CACHE_NAME = 'rnews-feed-v1';
const SNAPSHOT_URL = '/__rnews_feed_snapshot__';

function valid(value: unknown): value is FeedBootstrap {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FeedBootstrap>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.items) &&
    Boolean(candidate.pages && typeof candidate.pages === 'object')
  );
}

export async function readBrowserFeed(): Promise<FeedBootstrap | null> {
  if (!('caches' in window)) return null;
  try {
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
