'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

interface SearchBarProps {
  value: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function SearchBar({
  value,
  onSearch,
  placeholder = '搜索',
  inputRef,
}: SearchBarProps) {
  const [query, setQuery] = useState(value);
  const lastSent = useRef(value);

  useEffect(() => {
    setQuery(value);
    lastSent.current = value;
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query === lastSent.current) return;
      lastSent.current = query;
      onSearch(query);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && query) {
            event.preventDefault();
            event.stopPropagation();
            setQuery('');
            lastSent.current = '';
            onSearch('');
          }
        }}
        placeholder={placeholder}
        className="w-full bg-transparent pr-8 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 transition-colors duration-200 dark:text-zinc-200 dark:placeholder:text-zinc-600"
        aria-label="搜索标题或来源"
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            lastSent.current = '';
            onSearch('');
            inputRef?.current?.focus();
          }}
          className="absolute right-0 text-xs text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
          aria-label="清除搜索"
        >
          清除
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-0 hidden rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline dark:border-white/[0.08] dark:text-zinc-600">
          /
        </kbd>
      )}
    </div>
  );
}
