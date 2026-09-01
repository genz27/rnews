'use client';

import { getCatalogCategories } from '@/lib/catalog';
import { FeedItem, FeedResponse } from '@/lib/types';
import { FeedRow, FeedRowSkeleton } from './FeedCard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface FeedProps {
  category: string;
  searchQuery: string;
  refreshKey: number;
  initialItems?: FeedItem[];
  initialTotal?: number;
  initialHasMore?: boolean;
  initialStats?: FeedResponse['stats'];
  initialCachedAt?: number;
  onBusyChange?: (busy: boolean) => void;
  onRefreshed?: () => void;
  onCachedAt?: (cachedAt?: number) => void;
  onSource?: (source: string) => void;
  onCategory?: (category: string) => void;
  onPrefetch?: (prefetch: (category: string) => void) => void;
}

const EXCLUDE_WINDOW = 80;

type CachedPage = {
  items: FeedItem[];
  hasMore: boolean;
  total: number;
  stats?: FeedResponse['stats'];
  cachedAt?: number;
  cursor: number;
  enterFrom: number;
};

function pageKey(category: string, query: string) {
  return query ? `q:${category}:${query}` : `c:${category}`;
}

function toPage(data: FeedResponse, items: FeedItem[], cursor: number, enterFrom: number): CachedPage {
  return {
    items,
    hasMore: Boolean(data.hasMore),
    total: data.total ?? 0,
    stats: data.stats,
    cachedAt: data.cachedAt,
    cursor,
    enterFrom,
  };
}

export function Feed({
  category,
  searchQuery,
  refreshKey,
  initialItems = [],
  initialTotal = 0,
  initialHasMore = false,
  initialStats,
  initialCachedAt,
  onBusyChange,
  onRefreshed,
  onCachedAt,
  onSource,
  onCategory,
  onPrefetch,
}: FeedProps) {
  const bootKey = pageKey(category, searchQuery);
  const [pages, setPages] = useState<Record<string, CachedPage>>(() => {
    if (initialItems.length === 0) return {};
    return {
      [bootKey]: {
        items: initialItems,
        hasMore: initialHasMore,
        total: initialTotal,
        stats: initialStats,
        cachedAt: initialCachedAt,
        cursor: initialItems.length,
        enterFrom: initialItems.length,
      },
    };
  });
  const [loadingKey, setLoadingKey] = useState<string | null>(
    initialItems.length > 0 ? null : bootKey
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const inflightRef = useRef(new Set<string>());
  const requestIdRef = useRef(0);
  const prevRefreshRef = useRef(refreshKey);
  const onRefreshedRef = useRef(onRefreshed);
  onRefreshedRef.current = onRefreshed;
  const onCachedAtRef = useRef(onCachedAt);
  onCachedAtRef.current = onCachedAt;
  const { ref, inView } = useInView({ rootMargin: '800px' });

  const activeKey = pageKey(category, searchQuery);
  const recommend = category === '推荐' && !searchQuery;
  const activePage = pages[activeKey];

  const paintedKeyRef = useRef(activePage ? activeKey : '');
  if (activePage) paintedKeyRef.current = activeKey;
  const paintedKey = activePage ? activeKey : paintedKeyRef.current;

  const putPage = useCallback((key: string, page: CachedPage) => {
    setPages((prev) => {
      const next = { ...prev, [key]: page };
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
          const merged = unique.length === 0 ? [...existing.items, ...nextItems] : [...existing.items, ...unique];
          putPage(
            key,
            toPage(data, merged, data.nextCursor ?? cursor + nextItems.length, existing.items.length)
          );
        } else if (!pagesRef.current[key] || mode === 'reset') {
          putPage(
            key,
            toPage(data, nextItems, data.nextCursor ?? nextItems.length, nextItems.length)
          );
        }
        if (mode === 'reset' && forceRefresh) onRefreshedRef.current?.();
        if (key === pageKey(nextCategory, query)) onCachedAtRef.current?.(data.cachedAt);
      } catch (err) {
        if (mode === 'prefetch') return;
        if (requestIdRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        inflightRef.current.delete(inflightKey);
        if (mode !== 'prefetch' && requestIdRef.current === requestId) {
          setLoadingKey((current) => (current === key ? null : current));
          setLoadingMore(false);
          setRefreshing(false);
        }
        if (mode === 'prefetch') {
          setLoadingKey((current) => (current === key ? null : current));
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
    const refreshChanged = prevRefreshRef.current !== refreshKey;
    prevRefreshRef.current = refreshKey;
    if (refreshChanged) {
      inflightRef.current.clear();
      pagesRef.current = {};
      setPages({});
    }

    const key = pageKey(category, searchQuery);
    if (!refreshChanged && pagesRef.current[key]) {
      onCachedAtRef.current?.(pagesRef.current[key].cachedAt);
      return;
    }
    void loadPage(category, searchQuery, 'reset', refreshChanged);
  }, [category, loadPage, refreshKey, searchQuery]);

  useEffect(() => {
    if (inView && activePage?.hasMore && !loadingMore && !refreshing && !loadingKey && activePage.items.length > 0) {
      void loadPage(category, searchQuery, 'append');
    }
  }, [activePage, category, inView, loadPage, loadingKey, loadingMore, refreshing, searchQuery]);

  useEffect(() => {
    const run = () => {
      getCatalogCategories().forEach((name) => prefetch(name));
    };
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

  if (error && Object.keys(pages).length === 0) {
    return (
      <div className="animate-in py-16 text-center">
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

  const showSkeleton = !activePage && !paintedKey;
  const keys = Object.keys(pages);

  return (
    <div>
      {showSkeleton ? (
        <div className="animate-in">
          <p className="mb-2 text-xs text-zinc-500">正在读取订阅缓存…</p>
          {Array.from({ length: 10 }).map((_, index) => (
            <FeedRowSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {keys.map((key) => {
        const page = pages[key];
        const active = key === paintedKey && Boolean(pages[paintedKey]);
        return (
          <section key={key} hidden={!active} aria-hidden={!active}>
            <p className="mb-3 text-[13px] text-zinc-500">
              {searchQuery && active
                ? `找到 ${page.total} 条 · 「${searchQuery}」`
                : key === 'c:推荐'
                  ? `今日 ${page.total} 条 · 下滑或点刷新换一批`
                  : `${page.items.length}/${page.total}`}
              {page.stats?.ok ? ` · ${page.stats.ok}/${page.stats.sources} 源` : ''}
            </p>
            <div>
              {page.items.map((item, index) => (
                <FeedRow
                  key={`${item.id}-${index}`}
                  item={item}
                  enter={active && index >= page.enterFrom}
                  delay={Math.min(Math.max(index - page.enterFrom, 0), 12) * 32}
                  query={active ? searchQuery : ''}
                  onSource={onSource}
                  onCategory={onCategory}
                />
              ))}
            </div>
            {active ? (
              <div ref={ref} className="flex justify-center py-8">
                {loadingMore && (
                  <span className="loading-dots flex items-center gap-1.5 text-xs text-zinc-500">
                    <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    <span className="ml-2">{recommend ? '换一批' : '加载更多'}</span>
                  </span>
                )}
                {!page.hasMore && page.items.length > 0 && !recommend && (
                  <span className="animate-in text-xs text-zinc-600">已经到底了</span>
                )}
                {error && page.items.length > 0 ? (
                  <span className="text-xs text-zinc-500">{error}</span>
                ) : null}
              </div>
            ) : (
              <div className="h-8" />
            )}
          </section>
        );
      })}

      {!showSkeleton && activePage && activePage.items.length === 0 ? (
        <p className="animate-in py-16 text-center text-sm text-zinc-500">
          {searchQuery
            ? `没有找到「${searchQuery}」，试试别的关键词，或点来源名称筛选。`
            : recommend
              ? '今天还没有新内容，稍后再刷一次。'
              : '这个分类暂时没有内容。'}
        </p>
      ) : null}
    </div>
  );
}
