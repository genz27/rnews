import type {
  FeedBootstrap,
  FeedBootstrapPage,
  FeedItem,
  FeedResponse,
  InitialFeedPage,
} from './types';

function itemIdentity(item: FeedItem) {
  return item.id || item.link;
}

export function compactFeedPages(
  input: Record<string, InitialFeedPage>,
  cachedAt?: number,
  stats?: FeedResponse['stats']
): FeedBootstrap {
  const items: FeedItem[] = [];
  const itemIndexes = new Map<string, number>();
  const pages: Record<string, FeedBootstrapPage> = {};

  for (const [key, page] of Object.entries(input)) {
    const indexes = page.items.map((item) => {
      const identity = itemIdentity(item);
      const existing = itemIndexes.get(identity);
      if (existing !== undefined) return existing;
      const index = items.length;
      items.push({ ...item });
      itemIndexes.set(identity, index);
      return index;
    });
    pages[key] = {
      itemIndexes: indexes,
      hasMore: page.hasMore,
      total: page.total,
      cursor: page.cursor,
    };
  }

  return { version: 1, cachedAt, stats, items, pages };
}

export function expandFeedBootstrap(bootstrap: FeedBootstrap): Record<string, InitialFeedPage> {
  const pages: Record<string, InitialFeedPage> = {};
  for (const [key, page] of Object.entries(bootstrap.pages)) {
    pages[key] = {
      items: page.itemIndexes
        .map((index) => bootstrap.items[index])
        .filter((item): item is FeedItem => Boolean(item)),
      hasMore: page.hasMore,
      total: page.total,
      cursor: page.cursor,
    };
  }
  return pages;
}
