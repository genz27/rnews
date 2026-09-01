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
}: FeedProps) {
  const hasInitial = initialItems.length > 0 && category === '推荐' && !searchQuery && refreshKey === 0;
  const [items, setItems] = useState<FeedItem[]>(hasInitial ? initialItems : []);
  const [hasMore, setHasMore] = useState(hasInitial ? initialHasMore : true);
  const [loading, setLoading] = useState(!hasInitial);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(hasInitial ? initialTotal : 0);
  const [stats, setStats] = useState<FeedResponse['stats']>(initialStats);
  const [cachedAt, setCachedAt] = useState(initialCachedAt);
  const cursorRef = useRef(hasInitial ? initialItems.length : 0);
  const requestIdRef = useRef(0);
  const skipNextReset = useRef(hasInitial);
  const { ref, inView } = useInView({ rootMargin: '800px' });

  const loadPage = useCallback(
    async (reset: boolean) => {
      const requestId = reset ? requestIdRef.current + 1 : requestIdRef.current;
      requestIdRef.current = requestId;

      if (reset) {
        setLoading(true);
        setError(null);
        cursorRef.current = 0;
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          cursor: String(reset ? 0 : cursorRef.current),
        });
        if (category && category !== '全部') params.set('category', category);
        if (searchQuery) params.set('q', searchQuery);
        if (refreshKey > 0 && reset) params.set('refresh', '1');

        const response = await fetch(`/api/feed?${params.toString()}`, { cache: 'no-store' });
        const data = (await response.json()) as FeedResponse & { error?: string };
        if (requestIdRef.current !== requestId) return;

        if (!response.ok) {
          throw new Error(data.error || '订阅源暂时不可用');
        }

        const nextItems = data.items || [];
        setItems((prev) => (reset ? nextItems : [...prev, ...nextItems]));
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
    [category, searchQuery, refreshKey]
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

  const cacheLabel = cachedAt
    ? `缓存于 ${formatCacheAge(cachedAt)}`
    : null;

  if (error && items.length === 0 && !loading) {
    return (
      <div className="py-16 text-center">
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
      <div>
        <p className="mb-2 text-xs text-zinc-500">正在读取订阅缓存…</p>
        {Array.from({ length: 10 }).map((_, index) => (
          <FeedRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return <p className="py-16 text-center text-sm text-zinc-500">这个分类暂时没有内容。</p>;
  }

  return (
    <div className="animate-in">
      <p className="mb-3 text-[13px] text-zinc-500">
        {items.length}/{total}
        {stats?.ok ? ` · ${stats.ok}/${stats.sources} 源` : ''}
        {cacheLabel ? ` · ${cacheLabel}` : ''}
      </p>
      {items.map((item, index) => (
        <FeedRow key={`${item.id}-${index}`} item={item} />
      ))}
      <div ref={ref} className="flex justify-center py-8">
        {loadingMore && <span className="text-xs text-zinc-500">加载更多</span>}
        {!hasMore && items.length > 0 && <span className="text-xs text-zinc-600">已经到底了</span>}
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
