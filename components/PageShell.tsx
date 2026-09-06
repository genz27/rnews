'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { CategoryChips } from '@/components/CategoryChips';
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
  hideTitle = false,
  hidePills = false,
  hideSideNav = false,
  hideBottomNav = false,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  searchActive?: boolean;
  briefActive?: boolean;
  docsActive?: boolean;
  fullHeight?: boolean;
  hideTitle?: boolean;
  hidePills?: boolean;
  hideSideNav?: boolean;
  hideBottomNav?: boolean;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const categories = getNavCategories();
  const selected = searchActive ? 'AI' : briefActive ? '首页' : '';

  const goCategory = (category: string) => {
    if (category === '首页') {
      router.push('/');
      return;
    }
    router.push(`/?c=${encodeURIComponent(category)}`);
  };

  return (
    <div className={fullHeight ? 'flex h-svh flex-col overflow-hidden' : 'min-h-svh'}>
      <header className="shrink-0 border-b border-zinc-200/80 bg-zinc-50/95 pt-[env(safe-area-inset-top)] dark:border-white/[0.06] dark:bg-zinc-950/95 lg:bg-zinc-50/80 lg:backdrop-blur-lg lg:dark:bg-zinc-950/80">
        <div className="flex items-center gap-1 px-3 py-2 lg:hidden">
          <h1 className="shrink-0 px-1 text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <Link href="/">Rnews</Link>
          </h1>
          <div className="min-w-0 flex-1" />
          {searchActive ? (
            <Link
              href="/"
              className="shrink-0 px-1.5 text-sm text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              首页
            </Link>
          ) : null}
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
          <ThemeToggle compact />
        </div>
        {hidePills ? null : (
          <div className="px-4 pb-2.5 lg:hidden">
            <CategoryChips
              layout="pills"
              categories={categories}
              selected={briefActive ? '首页' : ''}
              onSelect={goCategory}
            />
          </div>
        )}

        <div className={`mx-auto hidden px-5 py-4 lg:block lg:px-8 lg:py-5 ${hideSideNav ? 'max-w-3xl' : 'max-w-6xl'}`}>
          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-zinc-900 lg:text-2xl dark:text-zinc-50">
                <Link href="/">Rnews</Link>
              </h1>
              <p className="mt-1 text-sm leading-6 text-zinc-500">{subtitle || '聚合技术社区、AI、科技媒体与主机资讯'}</p>
            </div>
            <div className="flex min-w-0 shrink-0 items-center justify-end gap-5">
              {headerRight}
              {searchActive ? (
                <Link
                  href="/"
                  className="shrink-0 text-sm text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  首页
                </Link>
              ) : null}
              {searchActive ? null : (
                <Link
                  href="/ask"
                  className="shrink-0 text-sm text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  AI 搜索
                </Link>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      <div
        className={`mx-auto flex w-full flex-1 gap-10 px-4 lg:gap-16 lg:px-8 ${hideSideNav ? 'max-w-3xl' : 'max-w-6xl'} ${
          fullHeight
            ? `min-h-0 overflow-hidden py-3 ${hideBottomNav ? 'pb-3' : 'pb-[calc(4.75rem+env(safe-area-inset-bottom))]'} lg:py-6 lg:pb-6`
            : hideBottomNav
              ? 'py-4 pb-6 lg:py-10 lg:pb-10'
              : 'py-4 pb-24 lg:py-10 lg:pb-10'
        }`}
      >
        {hideSideNav ? null : (
          <aside className="sticky top-3 hidden h-fit w-[13.5rem] shrink-0 lg:block">
            <SideNav
              categories={categories}
              selected=""
              searchActive={searchActive}
              briefActive={briefActive}
              docsActive={docsActive}
            />
          </aside>
        )}
        <main className={`min-w-0 flex-1 ${fullHeight ? 'flex min-h-0 flex-col' : ''}`}>
          {hideTitle ? null : fullHeight ? (
            <h2 className="mb-3 hidden shrink-0 text-base font-medium tracking-tight text-zinc-900 lg:block dark:text-zinc-50">
              {title}
            </h2>
          ) : (
            <h1 className="hidden text-2xl font-semibold tracking-tight text-zinc-900 lg:block dark:text-zinc-50">
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>
      {hideBottomNav ? null : <BottomNav selected={selected} />}
    </div>
  );
}
