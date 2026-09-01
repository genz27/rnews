'use client';

import { FeedItem, FeedResponse } from '@/lib/types';
import { FeedRow, FeedRowSkeleton } from './FeedCard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface FeedProps {
  category: string;
  searchQuery: string;
  refreshKey: number;
}

export function Feed({ category, searchQuery, refreshKey }: FeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<FeedResponse['stats']>();
  const cursorRef = useRef(0);
  const requestIdRef = useRef(0);
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
    void loadPage(true);
  }, [loadPage]);

  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore && items.length > 0) {
      void loadPage(false);
    }
  }, [inView, hasMore, loading, loadingMore, items.length, loadPage]);

  if (error && items.length === 0 && !loading) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
        <button
          onClick={() => void loadPage(true)}
          className="mt-4 rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          重新加载
        </button>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <p className="border-b border-zinc-200 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800">
          正在聚合订阅源…
        </p>
        {Array.from({ length: 12 }).map((_, index) => (
          <FeedRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-sm text-zinc-500">
        这个分类暂时没有内容，换个关键词或分类试试。
      </div>
    );
  }

  return (
    <>
      {stats && (
        <p className="mb-3 px-1 text-xs text-zinc-500">
          已展示 {items.length}/{total} 条
          {stats.ok ? ` · ${stats.ok}/${stats.sources} 个源可用` : ''}
          {stats.failed ? ` · ${stats.failed} 个源暂时失败` : ''}
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {items.map((item, index) => (
          <FeedRow key={`${item.id}-${index}`} item={item} />
        ))}
        <div ref={ref} className="flex justify-center py-5">
          {loadingMore && <span className="text-sm text-zinc-500">正在加载更多</span>}
          {!hasMore && items.length > 0 && <span className="text-sm text-zinc-400">已经到底了</span>}
        </div>
      </div>
    </>
  );
}
