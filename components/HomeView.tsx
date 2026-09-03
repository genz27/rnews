'use client';

import Link from 'next/link';
import { BackToTop } from '@/components/BackToTop';
import { BottomNav } from '@/components/BottomNav';
import { CategoryChips } from '@/components/CategoryChips';
import { SideNav } from '@/components/SideNav';
import { SearchBar } from '@/components/SearchBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Feed } from '@/components/Feed';
import { Toast } from '@/components/Toast';
import { persistCategory } from '@/lib/category-pref';
import { getCatalogCategories } from '@/lib/catalog';
import { formatUpdatedAt } from '@/lib/time';
import { FeedBootstrap } from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';

interface HomeViewProps {
  initialBootstrap: FeedBootstrap;
  initialCategory?: string;
  initialQuery?: string;
  initialCachedAt?: number;
}

export function HomeView({
  initialBootstrap,
  initialCategory = '推荐',
  initialQuery = '',
  initialCachedAt,
}: HomeViewProps) {
  const categories = getCatalogCategories();
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [refreshKey, setRefreshKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery));
  const [cachedAt, setCachedAt] = useState(initialCachedAt);
  const [now, setNow] = useState(() => Date.now());
  const searchRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const prefetchRef = useRef<(category: string) => void>(() => undefined);
  const selectedRef = useRef(selectedCategory);
  const queryRef = useRef(searchQuery);

  useEffect(() => {
    selectedRef.current = selectedCategory;
    queryRef.current = searchQuery;
  }, [searchQuery, selectedCategory]);

  const handleRegisterPrefetch = useCallback((prefetch: (category: string) => void) => {
    prefetchRef.current = prefetch;
  }, []);

  const handlePrefetch = useCallback((category: string) => {
    prefetchRef.current(category);
  }, []);

  const writeUrl = useCallback((category: string, query: string, push: boolean) => {
    const params = new URLSearchParams();
    if (category && category !== '推荐') params.set('c', category);
    if (query) params.set('q', query);
    const next = params.toString() ? `/?${params.toString()}` : '/';
    const state = { c: category, q: query };
    if (push) window.history.pushState(state, '', next);
    else window.history.replaceState(state, '', next);
  }, []);

  useEffect(() => {
    persistCategory(initialCategory);
    writeUrl(initialCategory, initialQuery, false);
  }, [initialCategory, initialQuery, writeUrl]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const handleBusy = useCallback((next: boolean) => {
    setBusy(next);
  }, []);

  const handleRefresh = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setRefreshKey((value) => value + 1);
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      writeUrl(selectedCategory, query, false);
    },
    [selectedCategory, writeUrl]
  );

  const handleSelectCategory = useCallback(
    (next: string, push = true) => {
      if (next === selectedRef.current && !queryRef.current) return;
      persistCategory(next);
      writeUrl(next, '', push);
      setSelectedCategory(next);
      setSearchQuery('');
    },
    [writeUrl]
  );

  const focusSearch = useCallback(() => {
    const mobile = window.matchMedia('(max-width: 1023px)').matches;
    if (mobile) {
      setSearchOpen(true);
      window.setTimeout(() => {
        searchRef.current?.focus();
        searchRef.current?.select();
      }, 20);
      return;
    }
    desktopSearchRef.current?.focus();
    desktopSearchRef.current?.select();
  }, []);

  const handleSource = useCallback(
    (source: string) => {
      setSearchQuery(source);
      writeUrl(selectedCategory, source, false);
      focusSearch();
    },
    [focusSearch, selectedCategory, writeUrl]
  );

  const handleRefreshed = useCallback(() => {
    setToast(selectedCategory === '推荐' && !searchQuery ? '已换一批' : '已更新');
  }, [searchQuery, selectedCategory]);

  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const onPop = () => {
      const params = new URLSearchParams(window.location.search);
      const nextCategory = params.get('c') || '推荐';
      const nextQuery = params.get('q') || '';
      setSelectedCategory(nextCategory);
      setSearchQuery(nextQuery);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
    };

    const move = (delta: number) => {
      const rows = Array.from(document.querySelectorAll<HTMLAnchorElement>('a.feed-title'));
      if (rows.length === 0) return;
      const index = rows.findIndex((row) => row === document.activeElement);
      const next = rows[index < 0 ? (delta > 0 ? 0 : rows.length - 1) : index + delta];
      if (!next) return;
      next.focus();
      next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };

    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        focusSearch();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === '/' && !isTyping(event.target)) {
        event.preventDefault();
        focusSearch();
        return;
      }

      if (event.key === '?' && !isTyping(event.target)) {
        event.preventDefault();
        setHelp((open) => !open);
        return;
      }

      if (event.key === 'Escape') {
        if (help) {
          setHelp(false);
          return;
        }
        if (searchQuery || searchRef.current?.value || searchOpen) {
          handleSearch('');
          setSearchOpen(false);
          searchRef.current?.blur();
          return;
        }
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }

      if (isTyping(event.target)) return;

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        handleRefresh();
        return;
      }
      if (event.key === 'j' || event.key === 'ArrowDown') {
        event.preventDefault();
        move(1);
        return;
      }
      if (event.key === 'k' || event.key === 'ArrowUp') {
        event.preventDefault();
        move(-1);
        return;
      }
      if (event.key === ']' || event.key === '[') {
        event.preventDefault();
        const current = Math.max(0, categories.indexOf(selectedCategory));
        const next = event.key === ']' ? Math.min(categories.length - 1, current + 1) : Math.max(0, current - 1);
        if (categories[next]) handleSelectCategory(categories[next]);
        return;
      }
      if (event.key === 't' || event.key === 'Home') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [categories, focusSearch, handleRefresh, handleSearch, handleSelectCategory, help, searchOpen, searchQuery, selectedCategory]);

  return (
    <div className="min-h-svh">
      <a
        href="#feed"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-zinc-900 focus:px-3 focus:py-1.5 focus:text-sm focus:text-white dark:focus:bg-zinc-100 dark:focus:text-zinc-900"
      >
        跳到内容
      </a>
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-zinc-50/95 pt-[env(safe-area-inset-top)] dark:border-white/[0.06] dark:bg-zinc-950/95 lg:bg-zinc-50/80 lg:backdrop-blur-lg lg:dark:bg-zinc-950/80">
        {busy ? (
          <div className="progress-bar text-zinc-900 dark:text-zinc-100">
            <div className="progress-bar-run" />
          </div>
        ) : null}
        <div className="flex items-center gap-1 px-3 py-2 lg:hidden">
          <h1 className="px-1 text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <Link href="/">Rnews</Link>
          </h1>
          <p className="min-w-0 flex-1 truncate px-1 text-xs text-zinc-400">
            {cachedAt ? formatUpdatedAt(cachedAt, now) : '聚合资讯'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchOpen((open) => {
                const next = !open;
                if (next) window.setTimeout(() => searchRef.current?.focus(), 20);
                return next;
              });
            }}
            className="inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
            aria-label="搜索"
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={busy}
            title="刷新"
            className="inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-60 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
            aria-label="刷新"
          >
            <RefreshIcon spinning={busy} />
          </button>
          <ThemeToggle compact />
        </div>
        {searchOpen ? (
          <div className="px-4 pb-2 lg:hidden">
            <div className="rounded-full bg-zinc-100 px-4 py-2 dark:bg-white/[0.06]">
              <SearchBar
                value={searchQuery}
                onSearch={handleSearch}
                placeholder="搜索标题、摘要或来源"
                inputRef={searchRef}
              />
            </div>
          </div>
        ) : null}
        <div className="px-4 pb-2.5 lg:hidden">
          <CategoryChips
            layout="pills"
            categories={categories}
            selected={selectedCategory}
            onSelect={handleSelectCategory}
            onPrefetch={handlePrefetch}
          />
        </div>

        <div className="mx-auto hidden max-w-6xl px-5 py-4 lg:block lg:px-8 lg:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 lg:text-2xl dark:text-zinc-50">
                <Link href="/">Rnews</Link>
              </h1>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                聚合技术社区、AI、科技媒体与主机资讯
                {cachedAt ? (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700"> · </span>
                    {formatUpdatedAt(cachedAt, now)}
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex min-w-0 items-center gap-5 lg:w-[28rem]">
              <div className="min-w-0 flex-1 border-b border-zinc-200/80 pb-2 transition-colors duration-200 focus-within:border-zinc-800 dark:border-white/[0.08] dark:focus-within:border-zinc-200">
                <SearchBar
                  value={searchQuery}
                  onSearch={handleSearch}
                  placeholder="搜索标题、摘要或来源"
                  inputRef={desktopSearchRef}
                />
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={busy}
                title="刷新（R）"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-800 disabled:opacity-60 dark:hover:text-zinc-200"
              >
                <RefreshIcon spinning={busy} />
                刷新
              </button>
              <span className="hidden text-zinc-300 sm:inline dark:text-zinc-700">·</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-4 pb-24 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-10 lg:pb-10">
        <aside className="hidden lg:block">
          <SideNav
            categories={categories}
            selected={selectedCategory}
            onSelect={handleSelectCategory}
            onPrefetch={handlePrefetch}
          />
        </aside>
        <main id="feed" className="min-w-0">
          <Feed
            category={selectedCategory}
            searchQuery={searchQuery}
            refreshKey={refreshKey}
            initialBootstrap={initialBootstrap}
            onBusyChange={handleBusy}
            onRefreshed={handleRefreshed}
            onCachedAt={setCachedAt}
            onSource={handleSource}
            onCategory={handleSelectCategory}
            onPrefetch={handleRegisterPrefetch}
          />
        </main>
      </div>

      <BottomNav selected={selectedCategory} onSelect={handleSelectCategory} />
      <BackToTop />
      <Toast message={toast} onDone={clearToast} />

      {help ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/30 p-4 backdrop-blur-[2px] sm:items-center"
          onClick={() => setHelp(false)}
        >
          <div
            role="dialog"
            aria-label="快捷键"
            className="w-full max-w-sm rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 shadow-lg dark:border-white/[0.08] dark:bg-zinc-900 dark:text-zinc-300"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-3 text-zinc-900 dark:text-zinc-50">快捷键</p>
            <ul className="space-y-2">
              <li><Kbd>/</Kbd> 或 <Kbd>⌘K</Kbd> 搜索</li>
              <li><Kbd>R</Kbd> 刷新 / 换一批</li>
              <li><Kbd>J</Kbd> <Kbd>K</Kbd> 上下移动，回车打开</li>
              <li><Kbd>[</Kbd> <Kbd>]</Kbd> 切换分类</li>
              <li><Kbd>T</Kbd> 回到顶部 · <Kbd>Esc</Kbd> 关闭</li>
            </ul>
            <p className="mt-4 text-xs text-zinc-400">点标题或摘要打开原文，点来源或分类即可筛选。</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-zinc-200 px-1.5 py-0.5 text-[11px] text-zinc-500 dark:border-white/[0.1] dark:text-zinc-400">
      {children}
    </kbd>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`size-4 ${spinning ? 'spin' : ''}`}
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
