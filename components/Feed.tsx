'use client';

import { readBrowserFeed, writeBrowserFeed } from '@/lib/browser-feed-cache';
import { getCatalogCategories } from '@/lib/catalog';
import { compactFeedPages, expandFeedBootstrap } from '@/lib/feed-bootstrap';
import { pageKey } from '@/lib/feed-key';
import type { FeedBootstrap, FeedItem, FeedResponse, InitialFeedPage } from '@/lib/types';
import { FeedRow, FeedRowSkeleton } from './FeedCard';
import { useCallback, useEffect, useRef, useState } from 'react';

interface FeedProps {
  category: string;
  searchQuery: string;
  refreshKey: number;
  initialBootstrap: FeedBootstrap;
  onBusyChange?: (busy: boolean) => void;
  onRefreshed?: () => void;
  onCachedAt?: (cachedAt?: number) => void;
  onSource?: (source: string) => void;
  onCategory?: (category: string) => void;
  onPrefetch?: (prefetch: (category: string) => void) => void;
}

const EXCLUDE_WINDOW = 80;

type CachedPage = InitialFeedPage & {
  stats?: FeedResponse['stats'];
  cachedAt?: number;
};

function expandCached(bootstrap: FeedBootstrap): Record<string, CachedPage> {
  const pages = expandFeedBootstrap(bootstrap);
  return Object.fromEntries(
    Object.entries(pages).map(([key, page]) => [
      key,
      { ...page, stats: bootstrap.stats, cachedAt: bootstrap.cachedAt },
    ])
  );
}

function compactCached(pages: Record<string, CachedPage>): FeedBootstrap {
  const compactable: Record<string, InitialFeedPage> = {};
  for (const [key, page] of Object.entries(pages)) {
    if (!key.startsWith('c:') && Object.keys(compactable).some((entry) => entry.startsWith('q:'))) {
      continue;
    }
    compactable[key] = page;
  }
  const first = Object.values(pages)[0];
  const cachedAt = Math.max(0, ...Object.values(pages).map((page) => page.cachedAt || 0));
  return compactFeedPages(compactable, cachedAt || undefined, first?.stats);
}

function isNewerBrowserSnapshot(browser: FeedBootstrap, current: FeedBootstrap) {
  const browserTime = browser.cachedAt || 0;
  const currentTime = current.cachedAt || 0;
  return browserTime > currentTime || (browserTime === currentTime && browser.items.length > current.items.length);
}

export function Feed({
  category,
  searchQuery,
  refreshKey,
  initialBootstrap,
  onBusyChange,
  onRefreshed,
  onCachedAt,
  onSource,
  onCategory,
  onPrefetch,
}: FeedProps) {
  const bootKey = pageKey(category, searchQuery);
  const [pages, setPages] = useState<Record<string, CachedPage>>(() => expandCached(initialBootstrap));
  const [loadingKey, setLoadingKey] = useState<string | null>(
    initialBootstrap.pages[bootKey] ? null : bootKey
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const pagesRef = useRef(pages);
  const inflightRef = useRef(new Set<string>());
  const requestIdRef = useRef(0);
  const prevRefreshRef = useRef(refreshKey);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onRefreshedRef = useRef(onRefreshed);
  const onCachedAtRef = useRef(onCachedAt);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    onRefreshedRef.current = onRefreshed;
    onCachedAtRef.current = onCachedAt;
  }, [onCachedAt, onRefreshed]);

  const activeKey = pageKey(category, searchQuery);
  const recommend = category === '推荐' && !searchQuery;
  const activePage = pages[activeKey];

  const putPage = useCallback((key: string, page: CachedPage) => {
    setPages((previous) => {
      const next = { ...previous, [key]: page };
      pagesRef.current = next;
      return next;
    });
  }, []);

  const fetchFeed = useCallback(
    async (nextCategory: string, query: string, cursor: number, refresh: boolean) => {
      const isRecommend = nextCategory === '推荐' && !query;
      const params = new URLSearchParams({ cursor: String(cursor) });
      if (nextCategory && nextCategory !== '全部') params.set('category', nextCategory);
      if (query) params.set('q', query);
      if (refresh) params.set('refresh', '1');
      if (isRecommend) {
        params.set('seed', String(Date.now()));
        const current = pagesRef.current[pageKey(nextCategory, query)];
        const excludeIds = current?.items.slice(-EXCLUDE_WINDOW).map((item) => item.id) ?? [];
        if (excludeIds.length > 0) params.set('exclude', excludeIds.join(','));
      }
      const response = await fetch(`/api/feed?${params.toString()}`, {
        cache: isRecommend || refresh ? 'no-store' : 'default',
      });
      const data = (await response.json()) as FeedResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || '订阅源暂时不可用');
      return data;
    },
    []
  );

  const loadPage = useCallback(
    async (
      nextCategory: string,
      query: string,
      mode: 'reset' | 'append' | 'prefetch',
      forceRefresh = false
    ) => {
      const key = pageKey(nextCategory, query);
      const inflightKey = mode === 'append' ? `${key}:more` : key;
      if (inflightRef.current.has(inflightKey)) return;
      if (mode === 'prefetch' && pagesRef.current[key]?.items.length) return;

      const requestId = mode === 'prefetch' ? requestIdRef.current : ++requestIdRef.current;
      inflightRef.current.add(inflightKey);
      if (mode === 'reset' && !pagesRef.current[key]) setLoadingKey(key);
      if (mode === 'reset' && forceRefresh) setRefreshing(true);
      if (mode === 'append') setLoadingMore(true);
      if (mode !== 'prefetch') setError(null);

      try {
        const existing = pagesRef.current[key];
        const cursor = mode === 'append' ? existing?.cursor ?? 0 : 0;
        const data = await fetchFeed(nextCategory, query, cursor, forceRefresh);
        if (mode !== 'prefetch' && requestIdRef.current !== requestId) return;

        const nextItems = data.items || [];
        if (mode === 'append' && existing) {
          const seen = new Set(existing.items.map((item) => item.id));
          const unique = nextItems.filter((item) => !seen.has(item.id));
          putPage(key, {
            items: [...existing.items, ...unique],
            hasMore: Boolean(data.hasMore),
            total: data.total ?? 0,
            stats: data.stats,
            cachedAt: data.cachedAt,
            cursor: data.nextCursor ?? cursor + nextItems.length,
          });
        } else {
          putPage(key, {
            items: nextItems,
            hasMore: Boolean(data.hasMore),
            total: data.total ?? 0,
            stats: data.stats,
            cachedAt: data.cachedAt,
            cursor: data.nextCursor ?? nextItems.length,
          });
        }
        if (mode === 'reset' && forceRefresh) onRefreshedRef.current?.();
        onCachedAtRef.current?.(data.cachedAt);
      } catch (caught) {
        if (mode === 'prefetch') return;
        if (requestIdRef.current !== requestId) return;
        setError(caught instanceof Error ? caught.message : '加载失败');
      } finally {
        inflightRef.current.delete(inflightKey);
        if (mode !== 'prefetch' && requestIdRef.current === requestId) {
          setLoadingKey((current) => (current === key ? null : current));
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [fetchFeed, putPage]
  );

  const prefetch = useCallback(
    (nextCategory: string) => {
      void loadPage(nextCategory, '', 'prefetch');
    },
    [loadPage]
  );

  useEffect(() => {
    onPrefetch?.(prefetch);
  }, [onPrefetch, prefetch]);

  useEffect(() => {
    let cancelled = false;
    void readBrowserFeed().then((browser) => {
      if (cancelled || !browser || !isNewerBrowserSnapshot(browser, initialBootstrap)) return;
      const cached = expandCached(browser);
      pagesRef.current = cached;
      setPages(cached);
      onCachedAtRef.current?.(browser.cachedAt);
    });
    return () => {
      cancelled = true;
    };
  }, [initialBootstrap]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void writeBrowserFeed(compactCached(pages));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [pages]);

  useEffect(() => {
    const refreshChanged = prevRefreshRef.current !== refreshKey;
    prevRefreshRef.current = refreshKey;
    if (!refreshChanged && pagesRef.current[activeKey]) {
      onCachedAtRef.current?.(pagesRef.current[activeKey].cachedAt);
      return;
    }
    void loadPage(category, searchQuery, 'reset', refreshChanged);
  }, [activeKey, category, loadPage, refreshKey, searchQuery]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          activePage?.hasMore &&
          !loadingMore &&
          !refreshing &&
          activePage.items.length > 0
        ) {
          void loadPage(category, searchQuery, 'append');
        }
      },
      { rootMargin: '800px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeKey, activePage, category, loadPage, loadingMore, refreshing, searchQuery]);

  useEffect(() => {
    const run = () => getCatalogCategories().forEach(prefetch);
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(run);
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 1);
    return () => window.clearTimeout(id);
  }, [prefetch]);

  useEffect(() => {
    onBusyChange?.(refreshing);
  }, [onBusyChange, refreshing]);

  if (error && !activePage && loadingKey !== activeKey) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-zinc-500">{error}</p>
        <button
          onClick={() => void loadPage(category, searchQuery, 'reset')}
          className="mt-4 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (!activePage) {
    return (
      <div>
        <p className="mb-2 text-xs text-zinc-500">正在读取订阅缓存…</p>
        {Array.from({ length: 8 }).map((_, index) => (
          <FeedRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (activePage.items.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-zinc-500">
        {searchQuery
          ? `没有找到「${searchQuery}」，试试别的关键词，或点来源名称筛选。`
          : recommend
            ? '今天还没有新内容，稍后再刷一次。'
            : '这个分类暂时没有内容。'}
      </p>
    );
  }

  return (
    <section className="feed-pane">
      <p className="mb-2 text-xs text-zinc-400 lg:mb-3 lg:text-[13px] lg:text-zinc-500">
        {searchQuery
          ? `找到 ${activePage.total} 条 · 「${searchQuery}」`
          : recommend
            ? `今日 ${activePage.total} 条 · 下滑或点刷新换一批`
            : `${activePage.items.length}/${activePage.total}`}
        {activePage.stats?.ok ? ` · ${activePage.stats.ok}/${activePage.stats.sources} 源` : ''}
      </p>
      <div>
        {activePage.items.map((item: FeedItem) => (
          <FeedRow
            key={item.id}
            item={item}
            enter={false}
            query={searchQuery}
            onSource={onSource}
            onCategory={onCategory}
          />
        ))}
      </div>
      <div ref={sentinelRef} className="flex justify-center py-8">
        {loadingMore && (
          <span className="loading-dots flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span className="ml-2">{recommend ? '换一批' : '加载更多'}</span>
          </span>
        )}
        {!activePage.hasMore && !recommend && (
          <span className="text-xs text-zinc-600">已经到底了</span>
        )}
        {error ? <span className="text-xs text-zinc-500">{error}</span> : null}
      </div>
    </section>
  );
}
