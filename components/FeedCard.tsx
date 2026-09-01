'use client';

import { FeedItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface FeedRowProps {
  item: FeedItem;
}

export function FeedRow({ item }: FeedRowProps) {
  const published = Number.isNaN(Date.parse(item.pubDate)) ? new Date() : new Date(item.pubDate);
  const timeAgo = formatDistanceToNow(published, { addSuffix: true, locale: zhCN });

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group grid gap-2 border-b border-zinc-200/80 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8 lg:py-6 dark:border-white/[0.06]"
    >
      <div className="min-w-0">
        <h2 className="text-base font-medium leading-7 tracking-tight text-zinc-800 transition-colors duration-200 group-hover:text-zinc-950 lg:text-[17px] lg:leading-8 dark:text-zinc-100 dark:group-hover:text-white">
          {item.titleZh || item.title}
        </h2>
        {item.titleZh && item.titleZh !== item.title && (
          <p className="mt-1 text-sm leading-6 text-zinc-500">{item.title}</p>
        )}
      </div>
      <p className="flex flex-wrap items-center gap-x-2 text-[13px] leading-6 text-zinc-500 sm:justify-end">
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
}

export function FeedRowSkeleton() {
  return (
    <div className="grid gap-2 border-b border-zinc-200/80 py-5 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-baseline sm:gap-8 lg:py-6 dark:border-white/[0.06]">
      <div className="h-5 w-4/5 animate-pulse rounded bg-zinc-200 dark:bg-white/[0.06]" />
      <div className="h-3.5 w-40 animate-pulse rounded bg-zinc-200 sm:justify-self-end dark:bg-white/[0.04]" />
    </div>
  );
}
