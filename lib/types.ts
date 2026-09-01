export interface FeedItem {
  id: string;
  title: string;
  titleZh?: string;
  snippet?: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
}

export interface FeedResponse {
  items: FeedItem[];
  hasMore: boolean;
  nextCursor?: number;
  total: number;
  stats?: {
    sources: number;
    ok: number;
    failed: number;
  };
  cachedAt?: number;
}

export interface InitialFeedPage {
  items: FeedItem[];
  hasMore: boolean;
  total: number;
  cursor: number;
}

export interface FeedBootstrapPage {
  itemIndexes: number[];
  hasMore: boolean;
  total: number;
  cursor: number;
}

export interface FeedBootstrap {
  version: 1;
  cachedAt?: number;
  stats?: FeedResponse['stats'];
  items: FeedItem[];
  pages: Record<string, FeedBootstrapPage>;
}

export interface FeedSource {
  url: string;
  title: string;
  category: string;
}
