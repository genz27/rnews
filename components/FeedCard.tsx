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
      className="group block border-b border-zinc-200/80 py-4 last:border-b-0 dark:border-white/[0.06]"
    >
      <h2 className="text-[15px] font-medium leading-6 tracking-tight text-zinc-800 transition-colors duration-200 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
        {item.title}
      </h2>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs leading-5 text-zinc-500">
        <span>{item.source}</span>
        {item.category && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{item.category}</span>
          </>
        )}
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span>{timeAgo}</span>
      </p>
    </a>
  );
}

export function FeedRowSkeleton() {
  return (
    <div className="border-b border-zinc-200/80 py-4 dark:border-white/[0.06]">
      <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-white/[0.06]" />
      <div className="mt-2 h-3 w-40 animate-pulse rounded bg-zinc-200 dark:bg-white/[0.04]" />
    </div>
  );
}
