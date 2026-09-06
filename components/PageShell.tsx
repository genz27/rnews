'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { SideNav } from '@/components/SideNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getNavCategories } from '@/lib/catalog';

export function PageShell({
  title,
  subtitle,
  searchActive,
  briefActive,
  docsActive,
  fullHeight = false,
  hideMobileBack = false,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  searchActive?: boolean;
  briefActive?: boolean;
  docsActive?: boolean;
  fullHeight?: boolean;
  hideMobileBack?: boolean;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const categories = getNavCategories();
  const selected = searchActive ? '搜索' : briefActive ? '首页' : docsActive ? '' : '';

  return (
    <div className={fullHeight ? 'flex h-svh flex-col overflow-hidden' : 'min-h-svh'}>
      <header className="shrink-0 border-b border-zinc-200/80 bg-zinc-50/95 pt-[env(safe-area-inset-top)] dark:border-white/[0.06] dark:bg-zinc-950/95 lg:bg-zinc-50/80 lg:backdrop-blur-lg lg:dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-8 lg:py-5">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 lg:text-2xl dark:text-zinc-50">
              <Link href="/">Rnews</Link>
            </h1>
            {subtitle ? <p className="mt-0.5 hidden text-sm leading-6 text-zinc-500 sm:block">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-4">
            {headerRight}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div
        className={`mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-10 px-4 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-16 lg:px-8 ${
          fullHeight
            ? 'min-h-0 overflow-hidden py-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:py-6 lg:pb-6'
            : 'py-6 pb-24 lg:py-10 lg:pb-10'
        }`}
      >
        <aside className="hidden lg:block">
          <SideNav
            categories={categories}
            selected={briefActive ? '首页' : ''}
            searchActive={searchActive}
            briefActive={briefActive}
            docsActive={docsActive}
          />
        </aside>
        <main className={`min-w-0 ${fullHeight ? 'flex min-h-0 flex-col' : ''}`}>
          {hideMobileBack ? null : (
            <p className="mb-6 lg:hidden">
              <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                ← 返回首页
              </Link>
            </p>
          )}
          {fullHeight ? null : (
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
          )}
          {fullHeight ? <h2 className="mb-3 shrink-0 text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2> : null}
          {children}
        </main>
      </div>
      <BottomNav selected={selected} />
    </div>
  );
}
