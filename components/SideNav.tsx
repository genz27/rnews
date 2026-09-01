'use client';

import Link from 'next/link';
import { CategoryChips } from '@/components/CategoryChips';

type SideNavProps = {
  categories: string[];
  selected?: string;
  onSelect?: (category: string) => void;
  docsActive?: boolean;
};

export function SideNav({ categories, selected = '', onSelect, docsActive = false }: SideNavProps) {
  return (
    <div className="sticky top-28">
      <p className="mb-3 px-3 text-xs tracking-wide text-zinc-400">分类</p>
      {onSelect ? (
        <CategoryChips layout="stack" categories={categories} selected={selected} onSelect={onSelect} />
      ) : (
        <nav className="flex flex-col gap-1">
          {categories.map((category) => (
            <Link
              key={category}
              href={category === '推荐' ? '/' : `/?c=${encodeURIComponent(category)}`}
              className="rounded-md px-3 py-2 text-sm text-zinc-500 transition hover:bg-zinc-100/70 hover:text-zinc-800 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200"
            >
              {category}
            </Link>
          ))}
        </nav>
      )}
      <div className="mt-8 border-t border-zinc-200/80 pt-4 dark:border-white/[0.06]">
        <p className="mb-2 px-3 text-xs tracking-wide text-zinc-400">更多</p>
        <Link
          href="/docs"
          className={`block rounded-md px-3 py-2 text-sm transition ${
            docsActive
              ? 'bg-zinc-100 text-zinc-900 dark:bg-white/[0.06] dark:text-zinc-50'
              : 'text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-800 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200'
          }`}
        >
          文档
        </Link>
        {!docsActive ? (
          <p className="mt-6 px-3 text-[11px] leading-5 text-zinc-400">
            R 刷新 · / 搜索 · J K 浏览
            <br />
            [ ] 分类 · ? 快捷键
          </p>
        ) : null}
      </div>
    </div>
  );
}
