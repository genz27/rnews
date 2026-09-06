import { fetchAllFeeds, filterItems } from './rss';
import { applyTranslation } from './translate';
import { FeedItem } from './types';

const NEWSY = /新闻|资讯|今日|今天|头条|速报|发生了什么|daily|news|headline|brief/i;

export function looksLikeNewsQuery(query: string) {
  return NEWSY.test(query.trim());
}

export async function searchNews(query: string, limit = 14): Promise<FeedItem[]> {
  const snapshot = await fetchAllFeeds();
  const q = query.trim();
  const fromSearch = q ? filterItems(snapshot.items, '全部', q) : [];
  const today = filterItems(snapshot.items, '推荐');
  const pool = today.length >= 6 ? today : snapshot.items;
  const merged = new Map<string, FeedItem>();
  for (const item of [...fromSearch, ...pool]) {
    const key = item.id || item.link;
    if (!merged.has(key)) merged.set(key, applyTranslation(item));
    if (merged.size >= Math.max(limit * 2, 24)) break;
  }
  return Array.from(merged.values()).slice(0, limit);
}

export function formatNewsContext(items: FeedItem[]) {
  if (items.length === 0) return '';
  return items
    .map((item, index) => {
      const title = item.titleZh || item.title;
      const snippet = item.snippet ? ` — ${item.snippet}` : '';
      return `${index + 1}. [${item.category}] ${title}${snippet}\n   来源 ${item.source} · ${item.link}`;
    })
    .join('\n');
}
