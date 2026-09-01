'use client';

import { CategoryChips } from '@/components/CategoryChips';
import { SearchBar } from '@/components/SearchBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Feed } from '@/components/Feed';
import { getCatalogCategories } from '@/lib/catalog';
import { FeedItem, FeedResponse } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

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
  const [selectedCategory, setSelectedCategory] = useState('推荐');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [busy, setBusy] = useState(false);

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

  const handleBusy = useCallback((next: boolean) => {
    setBusy(next);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const handleSelectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-zinc-950/80">
        {busy ? (
          <div className="progress-bar text-zinc-900 dark:text-zinc-100">
            <div className="progress-bar-run" />
          </div>
        ) : null}
        <div className="mx-auto max-w-6xl px-5 py-4 lg:px-8 lg:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 lg:text-2xl dark:text-zinc-50">
                RSS News
              </h1>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                聚合技术社区、AI、科技媒体与主机资讯。
              </p>
            </div>
            <div className="flex min-w-0 items-center gap-5 lg:w-[28rem]">
              <div className="min-w-0 flex-1 border-b border-zinc-200/80 pb-2 transition-colors duration-200 focus-within:border-zinc-800 dark:border-white/[0.08] dark:focus-within:border-zinc-200">
                <SearchBar onSearch={setSearchQuery} placeholder="搜索标题或来源" />
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={busy}
                className="inline-flex shrink-0 items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-800 disabled:opacity-60 dark:hover:text-zinc-200"
              >
                <RefreshIcon spinning={busy} />
                刷新
              </button>
              <span className="hidden text-zinc-300 sm:inline dark:text-zinc-700">·</span>
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-4 lg:hidden">
            <CategoryChips
              categories={categories}
              selected={selectedCategory}
              onSelect={handleSelectCategory}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-10">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="mb-3 px-3 text-xs tracking-wide text-zinc-400">分类</p>
            <CategoryChips
              layout="stack"
              categories={categories}
              selected={selectedCategory}
              onSelect={handleSelectCategory}
            />
          </div>
        </aside>
        <main className="min-w-0">
          <Feed
            category={selectedCategory}
            searchQuery={searchQuery}
            refreshKey={refreshKey}
            initialItems={initialItems}
            initialTotal={initialTotal}
            initialHasMore={initialHasMore}
            initialStats={initialStats}
            initialCachedAt={initialCachedAt}
            onBusyChange={handleBusy}
          />
        </main>
      </div>
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`size-3.5 ${spinning ? 'spin' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M13.5 8a5.5 5.5 0 1 1-1.3-3.5" strokeLinecap="round" />
      <path d="M13.5 2.5v3h-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
