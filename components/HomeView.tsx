'use client';

import { CategoryChips } from '@/components/CategoryChips';
import { SearchBar } from '@/components/SearchBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Feed } from '@/components/Feed';
import { getCatalogCategories } from '@/lib/catalog';
import { FeedItem, FeedResponse } from '@/lib/types';
import { useEffect, useState } from 'react';

interface HomeViewProps {
  initialItems: FeedItem[];
  initialTotal: number;
  initialHasMore: boolean;
  initialStats?: FeedResponse['stats'];
  initialCachedAt?: number;
}

export function HomeView({
  initialItems,
  initialTotal,
  initialHasMore,
  initialStats,
  initialCachedAt,
}: HomeViewProps) {
  const [categories, setCategories] = useState<string[]>(getCatalogCategories());
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-zinc-950/80">
        <div className="mx-auto max-w-xl px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">RSS News</h1>
              <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500">
                聚合技术社区、AI、科技媒体与主机资讯。
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="text-xs text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                刷新
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-5 border-b border-zinc-200/80 pb-3 dark:border-white/[0.06]">
            <SearchBar onSearch={setSearchQuery} placeholder="搜索标题或来源" />
          </div>
          <div className="mt-4">
            <CategoryChips categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 pb-16 pt-2">
        <Feed
          category={selectedCategory}
          searchQuery={searchQuery}
          refreshKey={refreshKey}
          initialItems={initialItems}
          initialTotal={initialTotal}
          initialHasMore={initialHasMore}
          initialStats={initialStats}
          initialCachedAt={initialCachedAt}
        />
      </main>
    </div>
  );
}
