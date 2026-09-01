import Parser from 'rss-parser';
import { parseStringPromise } from 'xml2js';
import { mergeSources } from './catalog';
import { FeedItem, FeedSource } from './types';

const parser = new Parser({
  timeout: 8000,
});

const OPML_URL =
  process.env.OPML_URL ||
  'https://raw.githubusercontent.com/JackyST0/awesome-rsshub-routes/main/feeds.opml';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 RSSNews/1.0';

const FRESH_MS = 15 * 60 * 1000;
const STALE_MS = 45 * 60 * 1000;
const FEED_TIMEOUT_MS = 7000;
const CONCURRENCY = 28;

type CacheState = {
  items: FeedItem[];
  time: number;
  ok: number;
  failed: number;
  sources: number;
  partial?: boolean;
};

let cache: CacheState | null = null;
let inflight: Promise<CacheState> | null = null;
let sourceCache: { sources: FeedSource[]; time: number } | null = null;

export function getCachedStats() {
  return cache
    ? {
        total: cache.items.length,
        sources: cache.sources,
        ok: cache.ok,
        failed: cache.failed,
        ageMs: Date.now() - cache.time,
      }
    : null;
}

export async function getSources(): Promise<FeedSource[]> {
  if (sourceCache && Date.now() - sourceCache.time < FRESH_MS) {
    return sourceCache.sources;
  }

  let opmlSources: FeedSource[] = [];
  try {
    opmlSources = await fetchOPML();
  } catch (error) {
    console.error('OPML fetch failed, using baked-in catalog:', error);
  }

  const sources = mergeSources(opmlSources);
  sourceCache = { sources, time: Date.now() };
  return sources;
}

async function fetchOPML(): Promise<FeedSource[]> {
  const response = await fetch(OPML_URL, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/xml, application/xml, */*' },
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 1800 },
  });
  if (!response.ok) {
    throw new Error(`OPML HTTP ${response.status}`);
  }

  const opmlText = await response.text();
  const opmlData = await parseStringPromise(opmlText);
  const feeds: FeedSource[] = [];
  const outlines = opmlData.opml?.body?.[0]?.outline || [];

  const processOutline = (outline: { $?: Record<string, string>; outline?: unknown[] }, parentCategory?: string) => {
    if (outline.$?.xmlUrl) {
      feeds.push({
        url: outline.$.xmlUrl,
        title: outline.$.title || outline.$.text || 'Unknown',
        category: parentCategory || outline.$.category || '其他',
      });
    }
    if (outline.outline) {
      const category = outline.$?.title || outline.$?.text || parentCategory;
      outline.outline.forEach((child) => processOutline(child as typeof outline, category));
    }
  };

  outlines.forEach((outline: { $?: Record<string, string>; outline?: unknown[] }) => processOutline(outline));
  return feeds;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    next: { revalidate: 1200 },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

function itemDate(item: { isoDate?: string; pubDate?: string; published?: string; updated?: string }): string {
  const raw = item.isoDate || item.pubDate || item.published || item.updated;
  if (!raw) return '1970-01-01T00:00:00.000Z';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '1970-01-01T00:00:00.000Z';
  return parsed.toISOString();
}

export async function fetchFeed(source: FeedSource): Promise<FeedItem[]> {
  const xml = await fetchText(source.url);
  const feed = await parser.parseString(xml);

  return (feed.items || [])
    .slice(0, 25)
    .map((item) => {
      const link = item.link || item.guid || source.url;
      return {
        id: String(item.guid || link || `${source.url}-${item.title}`),
        title: (item.title || '无标题').trim(),
        link,
        pubDate: itemDate(item),
        source: source.title,
        category: source.category,
      } satisfies FeedItem;
    })
    .filter((item) => item.title && item.link);
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function mergeItems(groups: FeedItem[][]): FeedItem[] {
  const unique = new Map<string, FeedItem>();
  for (const group of groups) {
    for (const item of group) {
      const key = (item.link || item.id).split('?')[0].replace(/\/+$/, '').toLowerCase();
      const existing = unique.get(key);
      if (!existing || Date.parse(item.pubDate) > Date.parse(existing.pubDate)) {
        unique.set(key, item);
      }
    }
  }
  return diversifyBySource(
    Array.from(unique.values()).sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate))
  );
}

function diversifyBySource(items: FeedItem[], windowSize = 10, maxPerWindow = 2): FeedItem[] {
  const waiting = [...items];
  const output: FeedItem[] = [];

  while (waiting.length > 0) {
    const window = output.slice(-windowSize);
    const counts = new Map<string, number>();
    for (const item of window) {
      counts.set(item.source, (counts.get(item.source) || 0) + 1);
    }
    const index = waiting.findIndex((item) => (counts.get(item.source) || 0) < maxPerWindow);
    if (index === -1) {
      output.push(waiting.shift()!);
    } else {
      output.push(waiting.splice(index, 1)[0]);
    }
  }

  return output;
}

function isPrioritySource(source: FeedSource): boolean {
  return /hnrss|github\.blog|sspai|v2ex|theverge|techcrunch|arxiv|nodeloc|simonwillison|ruanyifeng|cloudflare|huggingface|dev\.to|nextjs\.org|ithome|nodeseek|lowendtalk|github\.com\/.+\/releases\.atom/i.test(
    source.url
  );
}

async function refreshAll(): Promise<CacheState> {
  const sources = await getSources();
  let ok = 0;
  let failed = 0;

  const fetchBatch = (batch: FeedSource[]) =>
    mapPool(batch, CONCURRENCY, async (source) => {
      try {
        const items = await fetchFeed(source);
        ok += 1;
        return items;
      } catch (error) {
        failed += 1;
        console.warn(`Feed failed ${source.title}:`, error instanceof Error ? error.message : error);
        return [] as FeedItem[];
      }
    });

  const priority = sources.filter(isPrioritySource);
  const rest = sources.filter((source) => !isPrioritySource(source));

  if (priority.length === 0) {
    const groups = await fetchBatch(sources);
    cache = {
      items: mergeItems(groups),
      time: Date.now(),
      ok,
      failed,
      sources: sources.length,
      partial: false,
    };
    return cache;
  }

  const firstGroups = await fetchBatch(priority);
  cache = {
    items: mergeItems(firstGroups),
    time: Date.now(),
    ok,
    failed,
    sources: sources.length,
    partial: rest.length > 0,
  };

  if (rest.length === 0) {
    cache.partial = false;
    return cache;
  }

  const restGroups = await fetchBatch(rest);
  const state: CacheState = {
    items: mergeItems([...firstGroups, ...restGroups]),
    time: Date.now(),
    ok,
    failed,
    sources: sources.length,
    partial: false,
  };
  cache = state;
  return state;
}

export async function fetchAllFeeds(options?: { force?: boolean }): Promise<CacheState> {
  const force = options?.force ?? false;

  if (!force && cache && cache.items.length > 0 && !cache.partial) {
    const age = Date.now() - cache.time;
    if (age < FRESH_MS) return cache;
    if (age < STALE_MS) {
      if (!inflight) {
        const pending = refreshAll();
        inflight = pending;
        void pending.finally(() => {
          if (inflight === pending) inflight = null;
        });
      }
      return cache;
    }
  }

  if (!inflight || force) {
    const pending = refreshAll();
    inflight = pending;
    void pending.finally(() => {
      if (inflight === pending) inflight = null;
    });
  }

  if (!force && cache?.items.length) return cache;

  const started = Date.now();
  while (Date.now() - started < 12000) {
    if (cache?.items.length) return cache;
    if (!inflight) break;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  if (inflight) return inflight;

  return (
    cache ?? {
      items: [],
      time: Date.now(),
      ok: 0,
      failed: 0,
      sources: 0,
    }
  );
}

export function filterItems(
  items: FeedItem[],
  category?: string,
  query?: string
): FeedItem[] {
  let next = items;
  if (category && category !== '全部' && category !== 'All') {
    next = next.filter((item) => item.category === category);
  }
  if (query) {
    const q = query.toLowerCase();
    next = next.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q)
    );
  }
  return next;
}
