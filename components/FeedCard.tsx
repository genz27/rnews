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
      className="group flex gap-3 border-b border-zinc-200 px-3 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/70"
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {(item.source || 'R').slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 text-[13px] leading-5 text-zinc-500">
          <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{item.source}</span>
          {item.category && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">·</span>
              <span className="shrink-0">{item.category}</span>
            </>
          )}
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className="shrink-0">{timeAgo}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[15px] leading-6 text-zinc-800 group-hover:text-rose-600 dark:text-zinc-200 dark:group-hover:text-rose-300">
          {item.title}
        </p>
      </div>
    </a>
  );
}

export function FeedRowSkeleton() {
  return (
    <div className="flex gap-3 border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      <div className="min-w-0 flex-1 space-y-2 py-0.5">
        <div className="h-3 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
