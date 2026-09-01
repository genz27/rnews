'use client';

import { FeedItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Image from 'next/image';
import { useState } from 'react';

interface FeedCardProps {
  item: FeedItem;
}

const GRADIENT_COLORS = [
  'from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30',
  'from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30',
  'from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30',
  'from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30',
  'from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30',
];

export function FeedCard({ item }: FeedCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const gradientClass = GRADIENT_COLORS[Math.abs(item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % GRADIENT_COLORS.length];
  
  const timeAgo = formatDistanceToNow(new Date(item.pubDate), {
    addSuffix: true,
    locale: /[\u4e00-\u9fa5]/.test(item.title) ? zhCN : undefined
  });

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-zinc-800 hover:scale-[1.02]"
    >
      {item.image && !imageError ? (
        <div className="relative w-full aspect-[4/3] bg-gray-100 dark:bg-zinc-800 overflow-hidden">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className={`w-full aspect-[4/3] bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
          <div className="w-16 h-16 rounded-full bg-white/50 dark:bg-black/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-3 leading-snug group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
              {item.source}
            </span>
            {item.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 whitespace-nowrap">
                {item.category}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
            {timeAgo}
          </span>
        </div>
      </div>
    </a>
  );
}
