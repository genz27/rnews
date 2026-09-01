'use client';

import { getCatalogCategories } from '@/lib/catalog';
import { pageKey } from '@/lib/feed-key';
import { FeedItem, FeedResponse, InitialFeedPage } from '@/lib/types';
import { FeedRow, FeedRowSkeleton } from './FeedCard';
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface FeedProps {
  category: string;
  searchQuery: string;
  refreshKey: number;
  initialPages?: Record<string, InitialFeedPage>;
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

function toCached(
  page: InitialFeedPage,
  stats?: FeedResponse['stats'],
  cachedAt?: number
): CachedPage {
  return {
    items: page.items,
    hasMore: page.hasMore,
    total: page.total,
    stats,
    cachedAt,
    cursor: page.cursor,
    enterFrom: page.items.length,
  };
}

function bootState(
  initialPages: Record<string, InitialFeedPage> | undefined,
  initialItems: FeedItem[],
  initialTotal: number,
  initialHasMore: boolean,
  initialStats: FeedResponse['stats'] | undefined,
  initialCachedAt: number | undefined,
  bootKey: string
): Record<string, CachedPage> {
  const next: Record<string, CachedPage> = {};
  if (initialPages) {
    for (const [key, page] of Object.entries(initialPages)) {
      next[key] = toCached(page, initialStats, initialCachedAt);
    }
  }
  if (!next[bootKey] && initialItems.length > 0) {
    next[bootKey] = {
      items: initialItems,
      hasMore: initialHasMore,
      total: initialTotal,
      stats: initialStats,
      cachedAt: initialCachedAt,
      cursor: initialItems.length,
      enterFrom: initialItems.length,
    };
  }
  return next;
}

const FeedPane = memo(function FeedPane({
  pageKeyName,
  page,
  active,
  searchQuery,
  recommend,
  loadingMore,
  error,
  onSource,
  onCategory,
  sentinelRef,
}: {
  pageKeyName: string;
  page: CachedPage;
  active: boolean;
  searchQuery: string;
  recommend: boolean;
  loadingMore: boolean;
  error: string | null;
  onSource?: (source: string) => void;
  onCategory?: (category: string) => void;
  sentinelRef: (node?: Element | null) => void;
}) {
  return (
    <section className="feed-pane" hidden={!active} aria-hidden={!active}>
      <p className="mb-3 text-[13px] text-zinc-500">
        {searchQuery && active
          ? `找到 ${page.total} 条 · 「${searchQuery}」`
          : pageKeyName === 'c:推荐'
            ? `今日 ${page.total} 条 · 下滑或点刷新换一批`
            : `${page.items.length}/${page.total}`}
        {page.stats?.ok ? ` · ${page.stats.ok}/${page.stats.sources} 源` : ''}
      </p>
      <div>
        {page.items.map((item, index) => (
          <FeedRow
            key={`${item.id}-${index}`}
            item={item}
            enter={false}
            query={active ? searchQuery : ''}
            onSource={onSource}
            onCategory={onCategory}
          />
        ))}
      </div>
      {active ? (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingMore && (
            <span className="loading-dots flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
              <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
              <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
              <span className="ml-2">{recommend ? '换一批' : '加载更多'}</span>
            </span>
          )}
          {!page.hasMore && page.items.length > 0 && !recommend && (
            <span className="text-xs text-zinc-600">已经到底了</span>
          )}
          {error && page.items.length > 0 ? <span className="text-xs text-zinc-500">{error}</span> : null}
        </div>
      ) : (
        <div className="h-8" />
      )}
    </section>
  );
});

export function Feed({
  category,
  searchQuery,
  refreshKey,
  initialPages,
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
  const [pages, setPages] = useState<Record<string, CachedPage>>(() =>
    bootState(initialPages, initialItems, initialTotal, initialHasMore, initialStats, initialCachedAt, bootKey)
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  const inflightRef = useRef(new Set<string>());
  const requestIdRef = useRef(0);
  const prevRefreshRef = useRef(refreshKey);
  const scrollMapRef = useRef<Record<string, number>>({});
  const paintedKeyRef = useRef(bootKey);
  const onRefreshedRef = useRef(onRefreshed);
  onRefreshedRef.current = onRefreshed;
  const onCachedAtRef = useRef(onCachedAt);
  onCachedAtRef.current = onCachedAt;
  const { ref, inView } = useInView({ rootMargin: '800px' });

  const activeKey = pageKey(category, searchQuery);
  const recommend = category === '推荐' && !searchQuery;
  const activePage = pages[activeKey];

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
          putPage(key, {
            items: merged,
            hasMore: Boolean(data.hasMore),
            total: data.total ?? 0,
            stats: data.stats,
            cachedAt: data.cachedAt,
            cursor: data.nextCursor ?? cursor + nextItems.length,
            enterFrom: merged.length,
          });
        } else if (mode === 'reset' || !pagesRef.current[key]) {
          putPage(key, {
            items: nextItems,
            hasMore: Boolean(data.hasMore),
            total: data.total ?? 0,
            stats: data.stats,
            cachedAt: data.cachedAt,
            cursor: data.nextCursor ?? nextItems.length,
            enterFrom: nextItems.length,
          });
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

  useLayoutEffect(() => {
    const prev = paintedKeyRef.current;
    if (prev === activeKey) return;
    scrollMapRef.current[prev] = window.scrollY;
    paintedKeyRef.current = activeKey;
    const top = scrollMapRef.current[activeKey] ?? 0;
    window.scrollTo({ top, left: 0, behavior: 'instant' });
  }, [activeKey]);

  useEffect(() => {
    const refreshChanged = prevRefreshRef.current !== refreshKey;
    prevRefreshRef.current = refreshKey;
    if (refreshChanged) {
      inflightRef.current.clear();
      pagesRef.current = {};
      setPages({});
      scrollMapRef.current = {};
    }

    const key = pageKey(category, searchQuery);
    if (!refreshChanged && pagesRef.current[key]) {
      onCachedAtRef.current?.(pagesRef.current[key].cachedAt);
      return;
    }
    void loadPage(category, searchQuery, 'reset', refreshChanged);
  }, [category, loadPage, refreshKey, searchQuery]);

  useEffect(() => {
    if (inView && activePage?.hasMore && !loadingMore && !refreshing && activePage.items.length > 0) {
      void loadPage(category, searchQuery, 'append');
    }
  }, [activePage, category, inView, loadPage, loadingMore, refreshing, searchQuery]);

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

  return (
    <div>
      {Object.entries(pages).map(([key, page]) => (
        <FeedPane
          key={key}
          pageKeyName={key}
          page={page}
          active={key === activeKey}
          searchQuery={searchQuery}
          recommend={recommend}
          loadingMore={key === activeKey && loadingMore}
          error={key === activeKey ? error : null}
          onSource={onSource}
          onCategory={onCategory}
          sentinelRef={ref}
        />
      ))}
      {activePage.items.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">
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
