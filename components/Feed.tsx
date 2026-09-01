'use client';

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
}

const EXCLUDE_WINDOW = 80;

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
}: FeedProps) {
  const recommend = category === '推荐' && !searchQuery;
  const hasInitial =
    initialItems.length > 0 && category === '推荐' && !searchQuery && refreshKey === 0;
  const [items, setItems] = useState<FeedItem[]>(hasInitial ? initialItems : []);
  const [hasMore, setHasMore] = useState(hasInitial ? initialHasMore : true);
  const [loading, setLoading] = useState(!hasInitial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(hasInitial ? initialTotal : 0);
  const [stats, setStats] = useState<FeedResponse['stats']>(initialStats);
  const [cachedAt, setCachedAt] = useState(initialCachedAt);
  const [enterFrom, setEnterFrom] = useState(0);
  const cursorRef = useRef(hasInitial ? initialItems.length : 0);
  const requestIdRef = useRef(0);
  const skipNextReset = useRef(hasInitial);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const { ref, inView } = useInView({ rootMargin: '800px' });

  const loadPage = useCallback(
    async (reset: boolean) => {
      const requestId = reset ? requestIdRef.current + 1 : requestIdRef.current;
      requestIdRef.current = requestId;

      if (reset) {
        setLoading(true);
        setError(null);
        cursorRef.current = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setLoadingMore(true);
      }

      const seed = Date.now();
      const excludeIds = reset
        ? []
        : itemsRef.current.slice(-EXCLUDE_WINDOW).map((item) => item.id);

      try {
        const params = new URLSearchParams({
          cursor: String(reset ? 0 : cursorRef.current),
        });
        if (category && category !== '全部') params.set('category', category);
        if (searchQuery) params.set('q', searchQuery);
        if (refreshKey > 0 && reset && !recommend) params.set('refresh', '1');
        if (recommend) {
          params.set('seed', String(seed));
          if (excludeIds.length > 0) params.set('exclude', excludeIds.join(','));
        }

        const response = await fetch(`/api/feed?${params.toString()}`, { cache: 'no-store' });
        const data = (await response.json()) as FeedResponse & { error?: string };
        if (requestIdRef.current !== requestId) return;

        if (!response.ok) {
          throw new Error(data.error || '订阅源暂时不可用');
        }

        const nextItems = data.items || [];
        if (reset) {
          setEnterFrom(0);
          setItems(nextItems);
        } else {
          const from = itemsRef.current.length;
          setEnterFrom(from);
          setItems((prev) => {
            const seen = new Set(prev.map((item) => item.id));
            const unique = nextItems.filter((item) => !seen.has(item.id));
            if (unique.length === 0) return [...prev, ...nextItems];
            return [...prev, ...unique];
          });
        }
        setHasMore(Boolean(data.hasMore));
        cursorRef.current = data.nextCursor ?? cursorRef.current + nextItems.length;
        setTotal(data.total ?? 0);
        setStats(data.stats);
        setCachedAt(data.cachedAt);
        setError(null);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : '加载失败');
        if (reset) setItems([]);
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [category, recommend, refreshKey, searchQuery]
  );

  useEffect(() => {
    if (skipNextReset.current) {
      skipNextReset.current = false;
      return;
    }
    void loadPage(true);
  }, [loadPage]);

  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore && items.length > 0) {
      void loadPage(false);
    }
  }, [inView, hasMore, loading, loadingMore, items.length, loadPage]);

  useEffect(() => {
    onBusyChange?.(loading);
  }, [loading, onBusyChange]);

  const cacheLabel = cachedAt ? `缓存于 ${formatCacheAge(cachedAt)}` : null;
  const swapping = loading && items.length > 0;

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
        {recommend ? '今天还没有新内容，稍后再刷一次。' : '这个分类暂时没有内容。'}
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[13px] text-zinc-500 transition-opacity duration-300">
        {recommend ? `今日 ${total} 条 · 下滑或点刷新换一批` : `${items.length}/${total}`}
        {stats?.ok ? ` · ${stats.ok}/${stats.sources} 源` : ''}
        {cacheLabel ? ` · ${cacheLabel}` : ''}
      </p>
      <div className={`feed-list ${swapping ? 'feed-dim' : ''}`}>
        {items.map((item, index) => (
          <FeedRow
            key={`${item.id}-${index}`}
            item={item}
            enter={index >= enterFrom}
            delay={Math.min(Math.max(index - enterFrom, 0), 12) * 32}
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

function formatCacheAge(cachedAt: number) {
  const minutes = Math.max(0, Math.round((Date.now() - cachedAt) / 60000));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  return `${hours} 小时前`;
}
