import { FeedItem } from './types';

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
