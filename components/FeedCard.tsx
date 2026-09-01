'use client';

import { FeedItem } from '@/lib/types';
import { memo, type CSSProperties } from 'react';

interface FeedRowProps {
  item: FeedItem;
  enter?: boolean;
  delay?: number;
}

export const FeedRow = memo(function FeedRow({ item, enter = false, delay = 0 }: FeedRowProps) {
  const timeAgo = formatAgo(item.pubDate);

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      style={enter ? ({ '--enter-delay': `${delay}ms` } as CSSProperties) : undefined}
      className={`feed-row group relative grid gap-2 border-b border-zinc-200/80 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8 lg:py-6 dark:border-white/[0.06] ${
        enter ? 'feed-row-enter' : ''
      }`}
    >
      <span className="absolute inset-y-2 left-0 w-px origin-top scale-y-0 bg-zinc-900 opacity-0 transition duration-300 ease-out group-hover:scale-y-100 group-hover:opacity-100 dark:bg-zinc-100" />
      <div className="min-w-0 transition duration-300 ease-out group-hover:translate-x-1.5">
        <h2 className="text-base font-medium leading-7 tracking-tight text-zinc-800 transition-colors duration-200 group-hover:text-zinc-950 lg:text-[17px] lg:leading-8 dark:text-zinc-100 dark:group-hover:text-white">
          {item.titleZh || item.title}
        </h2>
        {item.titleZh && item.titleZh !== item.title && (
          <p className="mt-1 text-sm leading-6 text-zinc-500 transition-opacity duration-200 group-hover:text-zinc-400">
            {item.title}
          </p>
        )}
      </div>
      <p className="flex flex-wrap items-center gap-x-2 text-[13px] leading-6 text-zinc-500 transition duration-300 group-hover:text-zinc-600 sm:justify-end dark:group-hover:text-zinc-400">
        <span>{item.source}</span>
        {item.category && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{item.category}</span>
          </>
        )}
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span className="tabular-nums">{timeAgo}</span>
      </p>
    </a>
  );
});

export function FeedRowSkeleton() {
  return (
    <div className="grid gap-2 border-b border-zinc-200/80 py-5 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-baseline sm:gap-8 lg:py-6 dark:border-white/[0.06]">
      <div className="skeleton-line h-5 w-4/5 rounded" />
      <div className="skeleton-line h-3.5 w-40 rounded sm:justify-self-end" />
    </div>
  );
}

function formatAgo(iso: string) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '刚刚';
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours <= 1 ? '大约 1 小时前' : `大约 ${hours} 小时前`;
  const days = Math.round(hours / 24);
  return days <= 1 ? '1 天前' : `${days} 天前`;
}
