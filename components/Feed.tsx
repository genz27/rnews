'use client';

import { FeedItem, FeedResponse } from '@/lib/types';
import { FeedCard, FeedCardSkeleton } from './FeedCard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import Masonry from 'react-masonry-css';

interface FeedProps {
  category: string;
  searchQuery: string;
  refreshKey: number;
}

const breakpointColumns = {
  default: 4,
  1280: 3,
  768: 2,
};

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
  const { ref, inView } = useInView({ rootMargin: '600px' });

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
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
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
      <div>
        <p className="mb-4 text-center text-sm text-zinc-500">正在聚合订阅源，首次加载大约需要几秒钟…</p>
        <Masonry breakpointCols={breakpointColumns} className="flex -ml-3 w-auto" columnClassName="pl-3 bg-clip-padding">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="mb-3">
              <FeedCardSkeleton />
            </div>
          ))}
        </Masonry>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">这个分类暂时没有内容，换个关键词或分类试试。</p>
      </div>
    );
  }

  return (
    <>
      {stats && (
        <p className="mb-4 text-xs text-zinc-500">
          已展示 {items.length}/{total} 条
          {stats.ok ? ` · ${stats.ok}/${stats.sources} 个源可用` : ''}
          {stats.failed ? ` · ${stats.failed} 个源暂时失败` : ''}
        </p>
      )}
      <Masonry breakpointCols={breakpointColumns} className="flex -ml-3 w-auto" columnClassName="pl-3 bg-clip-padding">
        {items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="mb-3">
            <FeedCard item={item} />
          </div>
        ))}
      </Masonry>

      <div ref={ref} className="flex justify-center py-8">
        {loadingMore && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            正在加载更多
          </div>
        )}
        {!hasMore && items.length > 0 && <span className="text-sm text-zinc-400">已经到底了</span>}
      </div>
    </>
  );
}
