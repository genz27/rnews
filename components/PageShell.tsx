'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { SideNav } from '@/components/SideNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getCatalogCategories } from '@/lib/catalog';

export function PageShell({
  title,
  subtitle,
  searchActive,
  briefActive,
  docsActive,
  children,
}: {
  title: string;
  subtitle?: string;
  searchActive?: boolean;
  briefActive?: boolean;
  docsActive?: boolean;
  children: ReactNode;
}) {
  const categories = getCatalogCategories();

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-zinc-50/95 pt-[env(safe-area-inset-top)] dark:border-white/[0.06] dark:bg-zinc-950/95 lg:bg-zinc-50/80 lg:backdrop-blur-lg lg:dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8 lg:py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 lg:text-2xl dark:text-zinc-50">
              <Link href="/">Rnews</Link>
            </h1>
            {subtitle ? <p className="mt-1 text-sm leading-6 text-zinc-500">{subtitle}</p> : null}
          </div>
          <ThemeToggle />
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-10">
        <aside className="hidden lg:block">
          <SideNav
            categories={categories}
            searchActive={searchActive}
            briefActive={briefActive}
            docsActive={docsActive}
          />
        </aside>
        <main className="min-w-0">
          <p className="mb-6 lg:hidden">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
              ← 返回首页
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
