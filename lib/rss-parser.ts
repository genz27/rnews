import Parser from 'rss-parser';
import { parseStringPromise } from 'xml2js';
import { FeedItem, FeedSource } from './types';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'RSS-News-Aggregator/1.0'
  }
});

const OPML_URL = process.env.OPML_URL || 'https://raw.githubusercontent.com/JackyST0/awesome-rsshub-routes/main/feeds.opml';

const EXTRA_FEEDS: FeedSource[] = [
  { url: 'https://www.nodeloc.com/latest.rss', title: 'NodeLoc Latest', category: 'VPS/Hosting' },
  { url: 'https://www.nodeloc.com/top.rss', title: 'NodeLoc Top', category: 'VPS/Hosting' },
  { url: 'https://lowendtalk.com/discussions/feed.rss', title: 'LowEndTalk Discussions', category: 'VPS/Hosting' },
  { url: 'https://lowendtalk.com/categories/offers/feed.rss', title: 'LowEndTalk Offers', category: 'VPS/Hosting' },
  { url: 'https://lowendtalk.com/categories/requests/feed.rss', title: 'LowEndTalk Requests', category: 'VPS/Hosting' },
  { url: 'https://lowendspirit.com/discussions/feed.rss', title: 'LowEndSpirit', category: 'VPS/Hosting' },
  { url: 'https://www.webhostingtalk.com/external.php?type=RSS2', title: 'WebHostingTalk', category: 'VPS/Hosting' },
  { url: 'https://www.webhostingtalk.com/external.php?type=RSS2&forumids=103', title: 'WebHostingTalk Offers', category: 'VPS/Hosting' },
  { url: 'https://hostadvice.com/feed/', title: 'HostAdvice', category: 'VPS/Hosting' },
  { url: 'https://www.reddit.com/r/VPS/.rss', title: 'Reddit VPS', category: 'VPS/Hosting' },
  { url: 'https://www.reddit.com/r/webhosting/.rss', title: 'Reddit WebHosting', category: 'VPS/Hosting' },
  { url: 'https://www.reddit.com/r/HomeNetworking/.rss', title: 'Reddit HomeNetworking', category: 'VPS/Hosting' },
];

let cachedFeeds: FeedSource[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function fetchOPML(): Promise<FeedSource[]> {
  if (cachedFeeds && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedFeeds;
  }

  try {
    const response = await fetch(OPML_URL);
    const opmlText = await response.text();
    const opmlData = await parseStringPromise(opmlText);
    
    const feeds: FeedSource[] = [];
    const outlines = opmlData.opml?.body?.[0]?.outline || [];

    const processOutline = (outline: any, parentCategory?: string) => {
      if (outline.$ && outline.$.xmlUrl) {
        feeds.push({
          url: outline.$.xmlUrl,
          title: outline.$.title || outline.$.text || 'Unknown',
          category: parentCategory || outline.$.category
        });
      }
      
      if (outline.outline) {
        const category = outline.$.title || outline.$.text || parentCategory;
        outline.outline.forEach((child: any) => processOutline(child, category));
      }
    };

    outlines.forEach((outline: any) => processOutline(outline));
    
    cachedFeeds = [...feeds, ...EXTRA_FEEDS];
    cacheTime = Date.now();
    
    return cachedFeeds;
  } catch (error) {
    console.error('Error fetching OPML:', error);
    return EXTRA_FEEDS;
  }
}

export async function fetchFeed(source: FeedSource): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    
    return (feed.items || []).map((item) => {
      const image = extractImage(item);
      
      return {
        id: item.guid || item.link || `${source.url}-${item.title}`,
        title: item.title || 'Untitled',
        link: item.link || source.url,
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: source.title,
        category: source.category,
        image,
        description: item.contentSnippet || item.content
      };
    });
  } catch (error) {
    console.error(`Error fetching feed ${source.url}:`, error);
    return [];
  }
}

function extractImage(item: any): string | undefined {
  if (item.enclosure?.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.enclosure.url)) {
    return item.enclosure.url;
  }
  
  if (item['media:thumbnail']?.$?.url) {
    return item['media:thumbnail'].$.url;
  }
  
  if (item['media:content']?.$?.url) {
    return item['media:content'].$.url;
  }
  
  const content = item.content || item['content:encoded'] || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
  if (imgMatch) {
    return imgMatch[1];
  }
  
  return undefined;
}

let allItemsCache: FeedItem[] | null = null;
let itemsCacheTime = 0;

export async function fetchAllFeeds(): Promise<FeedItem[]> {
  if (allItemsCache && Date.now() - itemsCacheTime < CACHE_DURATION) {
    return allItemsCache;
  }

  const sources = await fetchOPML();
  
  const feedPromises = sources.map(source => 
    fetchFeed(source).catch(() => [])
  );
  
  const results = await Promise.all(feedPromises);
  const allItems = results.flat();
  
  const uniqueItems = new Map<string, FeedItem>();
  allItems.forEach(item => {
    if (!uniqueItems.has(item.id)) {
      uniqueItems.set(item.id, item);
    }
  });
  
  allItemsCache = Array.from(uniqueItems.values()).sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime()
  );
  
  itemsCacheTime = Date.now();
  
  return allItemsCache;
}
