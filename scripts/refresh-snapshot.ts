import path from 'node:path';

const root = process.cwd();
process.env.RSS_CACHE_PATH = path.join(root, 'data', 'rss-cache.json');
process.env.TRANSLATION_CACHE_PATH = path.join(root, 'data', 'translations.json');

async function main() {
  const { fetchAllFeeds } = await import('../lib/rss');

  const snapshot = await fetchAllFeeds({ wait: true });

  console.info(
    `Snapshot ready: ${snapshot.items.length} items, ${snapshot.ok}/${snapshot.sources} sources, ${snapshot.failed} failed`
  );
}

void main();
