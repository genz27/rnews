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
}

const EXCLUDE_WINDOW = 80;

type CachedPage = {
  items: FeedItem[];
  hasMore: boolean;
  total: number;
  stats?: FeedResponse['stats'];
  cachedAt?: number;
  cursor: number;
};

function pageKey(category: string, query: string) {
  return query ? `q:${category}:${query}` : `c:${category}`;
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
}: FeedProps) {
  const recommend = category === '推荐' && !searchQuery;
  const bootRef = useRef({ category, searchQuery });
  const hasInitial =
    initialItems.length > 0 &&
    refreshKey === 0 &&
    category === bootRef.current.category &&
    searchQuery === bootRef.current.searchQuery;
  const [items, setItems] = useState<FeedItem[]>(hasInitial ? initialItems : []);
  const [hasMore, setHasMore] = useState(hasInitial ? initialHasMore : true);
  const [loading, setLoading] = useState(!hasInitial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(hasInitial ? initialTotal : 0);
  const [stats, setStats] = useState<FeedResponse['stats']>(initialStats);
  const [enterFrom, setEnterFrom] = useState(hasInitial ? initialItems.length : 0);
  const [refreshing, setRefreshing] = useState(false);
  const cursorRef = useRef(hasInitial ? initialItems.length : 0);
  const requestIdRef = useRef(0);
  const skipNextReset = useRef(hasInitial);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pageCacheRef = useRef(new Map<string, CachedPage>());
  const prevSearchRef = useRef(searchQuery);
  const prevCategoryRef = useRef(category);
  const prevRefreshRef = useRef(refreshKey);
  const onRefreshedRef = useRef(onRefreshed);
  onRefreshedRef.current = onRefreshed;
  const onCachedAtRef = useRef(onCachedAt);
  onCachedAtRef.current = onCachedAt;
  const { ref, inView } = useInView({ rootMargin: '800px' });

  if (hasInitial && !pageCacheRef.current.has(pageKey(bootRef.current.category, bootRef.current.searchQuery))) {
    pageCacheRef.current.set(pageKey(bootRef.current.category, bootRef.current.searchQuery), {
      items: initialItems,
      hasMore: initialHasMore,
      total: initialTotal,
      stats: initialStats,
      cachedAt: initialCachedAt,
      cursor: initialItems.length,
    });
  }

  const showPage = useCallback((entry: CachedPage, animate: boolean) => {
    setItems(entry.items);
    setHasMore(entry.hasMore);
    setTotal(entry.total);
    setStats(entry.stats);
    setEnterFrom(animate ? 0 : entry.items.length);
    cursorRef.current = entry.cursor;
    onCachedAtRef.current?.(entry.cachedAt);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, []);

  const remember = useCallback(
    (key: string, data: FeedResponse, nextItems: FeedItem[], cursor: number) => {
      pageCacheRef.current.set(key, {
        items: nextItems,
        hasMore: Boolean(data.hasMore),
        total: data.total ?? 0,
        stats: data.stats,
        cachedAt: data.cachedAt,
        cursor,
      });
    },
    []
  );

  const loadPage = useCallback(
    async (reset: boolean) => {
      const searchChanged = prevSearchRef.current !== searchQuery;
      const refreshChanged = prevRefreshRef.current !== refreshKey;
      const categoryChanged = prevCategoryRef.current !== category;
      const shouldScroll = reset && (categoryChanged || refreshChanged) && !searchChanged;
      prevSearchRef.current = searchQuery;
      prevCategoryRef.current = category;
      prevRefreshRef.current = refreshKey;

      const key = pageKey(category, searchQuery);
      if (refreshChanged) pageCacheRef.current.clear();

      if (reset && !refreshChanged) {
        const cached = pageCacheRef.current.get(key);
        if (cached?.items.length) {
          showPage(cached, false);
          if (shouldScroll) window.scrollTo({ top: 0, behavior: 'instant' });
          return;
        }
      }

      const requestId = reset ? requestIdRef.current + 1 : requestIdRef.current;
      requestIdRef.current = requestId;

      if (reset) {
        if (itemsRef.current.length > 0) setRefreshing(true);
        else setLoading(true);
        setError(null);
        cursorRef.current = 0;
        if (shouldScroll) window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        setLoadingMore(true);
      }

      const seed = Date.now();
      const excludeIds = recommend
        ? itemsRef.current.slice(-EXCLUDE_WINDOW).map((item) => item.id)
        : [];

      try {
        const params = new URLSearchParams({
          cursor: String(reset ? 0 : cursorRef.current),
        });
        if (category && category !== '全部') params.set('category', category);
        if (searchQuery) params.set('q', searchQuery);
        if (refreshKey > 0 && reset) params.set('refresh', '1');
        if (recommend) {
          params.set('seed', String(seed));
          if (excludeIds.length > 0) params.set('exclude', excludeIds.join(','));
        }

        const response = await fetch(`/api/feed?${params.toString()}`, {
          cache: recommend || refreshKey > 0 ? 'no-store' : 'default',
        });
        const data = (await response.json()) as FeedResponse & { error?: string };
        if (requestIdRef.current !== requestId) return;

        if (!response.ok) {
          throw new Error(data.error || '订阅源暂时不可用');
        }

        const nextItems = data.items || [];
        if (reset) {
          setEnterFrom(0);
          setItems(nextItems);
          remember(key, data, nextItems, data.nextCursor ?? nextItems.length);
          if (refreshChanged) onRefreshedRef.current?.();
        } else {
          const from = itemsRef.current.length;
          setEnterFrom(from);
          setItems((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            const unique = nextItems.filter((item) => !seen.has(item.id));
            const merged = unique.length === 0 ? [...prev, ...nextItems] : [...prev, ...unique];
            remember(key, data, merged, data.nextCursor ?? cursorRef.current + nextItems.length);
            return merged;
          });
        }
        setHasMore(Boolean(data.hasMore));
        cursorRef.current = data.nextCursor ?? cursorRef.current + nextItems.length;
        setTotal(data.total ?? 0);
        setStats(data.stats);
        onCachedAtRef.current?.(data.cachedAt);
        setError(null);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : '加载失败');
        if (reset && itemsRef.current.length === 0) setItems([]);
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [category, recommend, refreshKey, remember, searchQuery, showPage]
  );

  useEffect(() => {
    if (skipNextReset.current) {
      skipNextReset.current = false;
      return;
    }
    void loadPage(true);
  }, [loadPage]);

  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore && !refreshing && items.length > 0) {
      void loadPage(false);
    }
  }, [inView, hasMore, loading, loadingMore, refreshing, items.length, loadPage]);

  useEffect(() => {
    onBusyChange?.(loading || refreshing);
  }, [loading, onBusyChange, refreshing]);

  useEffect(() => {
    const categories = getCatalogCategories();
    const timer = window.setTimeout(() => {
      categories.forEach((name) => {
        const key = pageKey(name, '');
        if (pageCacheRef.current.has(key)) return;
        const params = new URLSearchParams();
        if (name && name !== '全部') params.set('category', name);
        void fetch(`/api/feed?${params.toString()}`, { cache: name === '推荐' ? 'no-store' : 'default' })
          .then((response) => response.json() as Promise<FeedResponse>)
          .then((data) => {
            if (!data.items?.length || pageCacheRef.current.has(key)) return;
            remember(key, data, data.items, data.nextCursor ?? data.items.length);
          })
          .catch(() => undefined);
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [remember]);

  if (error && items.length === 0 && !loading) {
    return (
      <div className="animate-in py-16 text-center">
        <p className="text-sm text-zinc-500">{error}</p>
        <button
          onClick={() => void loadPage(true)}
          className="mt-4 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="animate-in">
        <p className="mb-2 text-xs text-zinc-500">正在读取订阅缓存…</p>
        {Array.from({ length: 10 }).map((_, index) => (
          <FeedRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <p className="animate-in py-16 text-center text-sm text-zinc-500">
        {searchQuery
          ? `没有找到「${searchQuery}」，试试别的关键词，或点来源名称筛选。`
          : recommend
            ? '今天还没有新内容，稍后再刷一次。'
            : '这个分类暂时没有内容。'}
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[13px] text-zinc-500 transition-opacity duration-300">
        {searchQuery
          ? `找到 ${total} 条 · 「${searchQuery}」`
          : recommend
            ? `今日 ${total} 条 · 下滑或点刷新换一批`
            : `${items.length}/${total}`}
        {stats?.ok ? ` · ${stats.ok}/${stats.sources} 源` : ''}
      </p>
      <div className="feed-list">
        {items.map((item, index) => (
          <FeedRow
            key={`${item.id}-${index}`}
            item={item}
            enter={index >= enterFrom}
            delay={Math.min(Math.max(index - enterFrom, 0), 12) * 32}
            query={searchQuery}
            onSource={onSource}
            onCategory={onCategory}
          />
        ))}
      </div>
      <div ref={ref} className="flex justify-center py-8">
        {loadingMore && (
          <span className="loading-dots flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span className="size-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
            <span className="ml-2">{recommend ? '换一批' : '加载更多'}</span>
          </span>
        )}
        {!hasMore && items.length > 0 && !recommend && (
          <span className="animate-in text-xs text-zinc-600">已经到底了</span>
        )}
      </div>
    </div>
  );
}
