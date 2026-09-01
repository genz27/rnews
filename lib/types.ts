export interface FeedItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  image?: string;
  description?: string;
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
}

export interface FeedSource {
  url: string;
  title: string;
  category: string;
}
