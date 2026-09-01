export interface FeedItem {
  id: string;
  title: string;
  link: string;
  pubDate: Date;
  source: string;
  category?: string;
  image?: string;
  description?: string;
}

export interface FeedResponse {
  items: FeedItem[];
  hasMore: boolean;
  nextCursor?: number;
}

export interface FeedSource {
  url: string;
  title: string;
  category?: string;
}
