'use client';

import { useEffect, useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = '搜索' }: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <input
      type="text"
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      placeholder={placeholder}
      className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 transition-colors duration-200 dark:text-zinc-200 dark:placeholder:text-zinc-600"
    />
  );
}
