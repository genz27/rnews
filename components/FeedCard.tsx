'use client';

import { FeedItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useState } from 'react';

interface FeedCardProps {
  item: FeedItem;
}

const GRADIENT_COLORS = [
  'from-rose-100 via-pink-50 to-orange-100 dark:from-rose-950/50 dark:via-pink-950/30 dark:to-orange-950/40',
  'from-sky-100 via-indigo-50 to-violet-100 dark:from-sky-950/50 dark:via-indigo-950/30 dark:to-violet-950/40',
  'from-emerald-100 via-teal-50 to-cyan-100 dark:from-emerald-950/50 dark:via-teal-950/30 dark:to-cyan-950/40',
  'from-amber-100 via-yellow-50 to-lime-100 dark:from-amber-950/50 dark:via-yellow-950/30 dark:to-lime-950/40',
  'from-fuchsia-100 via-purple-50 to-pink-100 dark:from-fuchsia-950/50 dark:via-purple-950/30 dark:to-pink-950/40',
];

function hashIndex(value: string, modulo: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash) % modulo;
}

export function FeedCard({ item }: FeedCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const gradientClass = GRADIENT_COLORS[hashIndex(item.id || item.title, GRADIENT_COLORS.length)];
  const published = Number.isNaN(Date.parse(item.pubDate)) ? new Date() : new Date(item.pubDate);
  const timeAgo = formatDistanceToNow(published, { addSuffix: true, locale: zhCN });
  const imageSrc = item.image ? `/api/image?url=${encodeURIComponent(item.image)}` : null;
  const showImage = Boolean(imageSrc) && !imageError;

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(244,63,94,0.16)] dark:border-white/10 dark:bg-zinc-900 dark:shadow-none"
    >
      {showImage ? (
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc!}
            alt=""
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className={`flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br ${gradientClass}`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/70 text-lg font-semibold text-rose-500 shadow-sm dark:bg-black/30 dark:text-rose-300">
            {(item.source || 'R').slice(0, 1)}
          </div>
        </div>
      )}

      <div className="space-y-3 p-3.5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-rose-600 dark:text-zinc-50 dark:group-hover:text-rose-300">
          {item.title}
        </h3>
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-medium text-zinc-600 dark:text-zinc-400">{item.source}</span>
            {item.category && (
              <span className="shrink-0 rounded-full bg-rose-50 px-1.5 py-0.5 text-rose-500 dark:bg-rose-950/60 dark:text-rose-300">
                {item.category}
              </span>
            )}
          </div>
          <span className="shrink-0 text-zinc-400">{timeAgo}</span>
        </div>
      </div>
    </a>
  );
}

export function FeedCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-zinc-900">
      <div className="aspect-[3/4] animate-pulse bg-zinc-100 dark:bg-zinc-800" />
      <div className="space-y-3 p-3.5">
        <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
