'use client';

import { FeedItem, FeedResponse } from '@/lib/types';
import { FeedCard } from './FeedCard';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import Masonry from 'react-masonry-css';

interface FeedProps {
  category: string;
  searchQuery: string;
}

export function Feed({ category, searchQuery }: FeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const { ref, inView } = useInView({
    threshold: 0.5,
  });
  
  const prevCategoryRef = useRef(category);
  const prevSearchQueryRef = useRef(searchQuery);

  const fetchItems = useCallback(async (reset = false) => {
    if (loading || (!reset && !hasMore)) return;

    setLoading(true);
    setError(null);

    try {
      const currentCursor = reset ? 0 : cursor;
      const params = new URLSearchParams({
        cursor: currentCursor.toString(),
        ...(category !== 'All' && { category }),
        ...(searchQuery && { q: searchQuery })
      });

      const response = await fetch(`/api/feed?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch feeds');
      }

      const data: FeedResponse = await response.json();

      setItems(prev => reset ? data.items : [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery, cursor, hasMore, loading]);

  useEffect(() => {
    if (
      category !== prevCategoryRef.current ||
      searchQuery !== prevSearchQueryRef.current
    ) {
      setItems([]);
      setHasMore(true);
      setCursor(0);
      fetchItems(true);
      
      prevCategoryRef.current = category;
      prevSearchQueryRef.current = searchQuery;
    }
  }, [category, searchQuery, fetchItems]);

  useEffect(() => {
    if (items.length === 0 && !loading && !error) {
      fetchItems(true);
    }
  }, []);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchItems();
    }
  }, [inView, hasMore, loading, fetchItems]);

  const breakpointColumns = {
    default: 4,
    1536: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 2
  };

  if (error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          {error}
        </p>
        <button
          onClick={() => fetchItems(true)}
          className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          No items found
        </p>
      </div>
    );
  }

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumns}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {items.map((item) => (
          <div key={item.id} className="mb-4">
            <FeedCard item={item} />
          </div>
        ))}
      </Masonry>

      {hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          {loading && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Loading more...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No more items
        </div>
      )}
    </>
  );
}
