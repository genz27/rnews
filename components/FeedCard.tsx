'use client';

import { FeedItem } from '@/lib/types';
import { memo, type CSSProperties, type MouseEvent, type ReactNode } from 'react';

interface FeedRowProps {
  item: FeedItem;
  enter?: boolean;
  delay?: number;
  query?: string;
  onSource?: (source: string) => void;
  onCategory?: (category: string) => void;
}

export const FeedRow = memo(function FeedRow({
  item,
  enter = false,
  delay = 0,
  query = '',
  onSource,
  onCategory,
}: FeedRowProps) {
  const timeAgo = formatAgo(item.pubDate);
  const display = item.titleZh || item.title;
  const original = item.titleZh && item.titleZh !== item.title ? item.title : '';
  const snippet =
    item.snippet && item.snippet !== display && item.snippet !== item.title ? item.snippet : '';

  return (
    <article
      style={enter ? ({ '--enter-delay': `${delay}ms` } as CSSProperties) : undefined}
      className={`feed-row group relative grid gap-2 border-b border-zinc-200/80 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8 lg:py-6 dark:border-white/[0.06] ${
        enter ? 'feed-row-enter' : ''
      }`}
    >
      <span className="absolute inset-y-2 left-0 w-px origin-top scale-y-0 bg-zinc-900 opacity-0 transition duration-300 ease-out group-hover:scale-y-100 group-hover:opacity-100 group-focus-within:scale-y-100 group-focus-within:opacity-100 dark:bg-zinc-100" />
      <div className="min-w-0 transition duration-300 ease-out group-hover:translate-x-1.5 group-focus-within:translate-x-1.5">
        <h2 className="text-base font-medium leading-7 tracking-tight lg:text-[17px] lg:leading-8">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="feed-title text-zinc-800 outline-none transition-colors duration-200 hover:text-zinc-950 focus-visible:text-zinc-950 dark:text-zinc-100 dark:hover:text-white dark:focus-visible:text-white"
          >
            <Highlight text={display} query={query} />
          </a>
        </h2>
        {original ? (
          <p className="mt-1 text-sm leading-6 text-zinc-500 transition-opacity duration-200 group-hover:text-zinc-400">
            <Highlight text={original} query={query} />
          </p>
        ) : null}
        {snippet ? (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-zinc-500 transition-colors duration-200 group-hover:text-zinc-600 dark:group-hover:text-zinc-400">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              className="outline-none"
            >
              <Highlight text={snippet} query={query} />
            </a>
          </p>
        ) : null}
      </div>
      <p className="flex flex-wrap items-center gap-x-2 text-[13px] leading-6 text-zinc-500 sm:justify-end">
        <MetaButton
          title="按这个来源筛选"
          onClick={() => onSource?.(item.source)}
        >
          <Highlight text={item.source} query={query} />
        </MetaButton>
        {item.category ? (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <MetaButton
              title={`查看${item.category}`}
              onClick={() => onCategory?.(item.category)}
            >
              {item.category}
            </MetaButton>
          </>
        ) : null}
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span className="tabular-nums">{timeAgo}</span>
      </p>
    </article>
  );
});

function MetaButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  const handle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      title={title}
      onClick={handle}
      className="transition hover:text-zinc-800 dark:hover:text-zinc-200"
    >
      {children}
    </button>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return text;
  const lower = text.toLowerCase();
  const match = needle.toLowerCase();
  const index = lower.indexOf(match);
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export function FeedRowSkeleton() {
  return (
    <div className="grid gap-2 border-b border-zinc-200/80 py-5 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-baseline sm:gap-8 lg:py-6 dark:border-white/[0.06]">
      <div className="min-w-0 space-y-2">
        <div className="skeleton-line h-5 w-4/5 rounded" />
        <div className="skeleton-line h-3.5 w-full rounded" />
        <div className="skeleton-line h-3.5 w-2/3 rounded" />
      </div>
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
