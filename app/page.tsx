'use client';

import { CategoryChips } from '@/components/CategoryChips';
import { SearchBar } from '@/components/SearchBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Feed } from '@/components/Feed';
import { getCatalogCategories } from '@/lib/catalog';
import { useEffect, useState } from 'react';

export default function Home() {
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="mb-3 flex items-center gap-3">
            <h1 className="shrink-0 bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl">
              RSS NEWS
            </h1>
            <div className="min-w-0 flex-1">
              <SearchBar onSearch={setSearchQuery} placeholder="搜索标题或来源" />
            </div>
            <ThemeToggle />
          </div>
          <CategoryChips categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        <Feed category={selectedCategory} searchQuery={searchQuery} refreshKey={refreshKey} />
      </main>

      <button
        type="button"
        onClick={() => setRefreshKey((value) => value + 1)}
        className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-600 md:bottom-8 md:right-8"
        aria-label="刷新订阅"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0019 8l1-2M19 5A9 9 0 005 16l-1 2" />
        </svg>
      </button>
    </div>
  );
}
