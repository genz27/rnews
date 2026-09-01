import { getCatalogCategories } from '@/lib/catalog';
import { pageKey } from '@/lib/feed-key';
import { filterItems, pickRandomItems } from '@/lib/rss';
import { applyTranslation } from '@/lib/translate';
import { FeedItem, InitialFeedPage } from '@/lib/types';

export { pageKey } from '@/lib/feed-key';

export const PAGE_SIZE = 40;

export function buildPage(
  items: FeedItem[],
  category: string,
  query = '',
  cursor = 0,
  seed = Date.now(),
  exclude: string[] = []
): InitialFeedPage {
  const pool = filterItems(items, category, query);
  const recommend = category === '推荐' && !query;
  const slice = recommend
    ? pickRandomItems(pool, PAGE_SIZE, seed, exclude)
    : pool.slice(cursor, cursor + PAGE_SIZE);
  const translated = slice.map((item) => applyTranslation(item));
  const hasMore = recommend ? pool.length > 0 : cursor + PAGE_SIZE < pool.length;
  return {
    items: translated,
    hasMore,
    total: pool.length,
    cursor: recommend ? cursor + translated.length : hasMore ? cursor + PAGE_SIZE : cursor + translated.length,
  };
}

export function buildInitialPages(
  items: FeedItem[],
  seed = Date.now()
): Record<string, InitialFeedPage> {
  const pages: Record<string, InitialFeedPage> = {};
  for (const category of getCatalogCategories()) {
    pages[pageKey(category)] = buildPage(items, category, '', 0, seed);
  }
  return pages;
}
