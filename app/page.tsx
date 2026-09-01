'use client';

import { CategoryChips } from '@/components/CategoryChips';
import { SearchBar } from '@/components/SearchBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Feed } from '@/components/Feed';
import { useEffect, useState } from 'react';

export default function Home() {
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              RSS NEWS
            </h1>
            <ThemeToggle />
          </div>
          
          <div className="mb-4">
            <SearchBar 
              onSearch={setSearchQuery}
              placeholder="Search articles..."
            />
          </div>

          <CategoryChips
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Feed category={selectedCategory} searchQuery={searchQuery} />
      </main>
    </div>
  );
}
