import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const BATCH_SIZE = 40;
const BATCH_CONCURRENCY = 8;

type TranslationMap = Record<string, string>;

let map: TranslationMap = {};
let loaded = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let translatingAll = false;

function storePath() {
  if (process.env.VERCEL) return '/tmp/rss-translations.json';
  return path.join(process.cwd(), '.data', 'rss-translations.json');
}

async function loadMap() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await readFile(/* turbopackIgnore: true */ storePath(), 'utf8');
    const parsed = JSON.parse(raw) as TranslationMap;
    if (parsed && typeof parsed === 'object') map = parsed;
  } catch {
    map = {};
  }
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistMap();
  }, 800);
}

async function persistMap() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  try {
    const file = storePath();
    await mkdir(/* turbopackIgnore: true */ path.dirname(file), { recursive: true });
    await writeFile(/* turbopackIgnore: true */ file, JSON.stringify(map));
  } catch (error) {
    console.warn('Failed to persist translations:', error instanceof Error ? error.message : error);
  }
}

export async function loadTranslations() {
  await loadMap();
}

export function isEnglishTitle(title: string): boolean {
  const text = title.trim();
  if (!text) return false;
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const letters = (text.match(/[A-Za-z]/g) || []).length;
  if (letters < 8) return false;
  if (cjk >= 2 && cjk * 2 >= letters) return false;
  return letters > cjk * 2;
}

function parseBatchResponse(data: unknown, count: number): string[] {
  if (!Array.isArray(data)) return [];
  return data.slice(0, count).map((entry) => {
    if (typeof entry === 'string') return entry.trim();
    if (Array.isArray(entry) && typeof entry[0] === 'string') return entry[0].trim();
    return '';
  });
}

async function translateBatch(titles: string[]): Promise<string[]> {
  const body = titles.map((title) => `q=${encodeURIComponent(title)}`).join('&');
  const response = await fetch(
    'https://translate.googleapis.com/translate_a/t?client=gtx&sl=auto&tl=zh-CN',
    {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
      signal: AbortSignal.timeout(20000),
    }
  );
  if (!response.ok) {
    throw new Error(`translate HTTP ${response.status}`);
  }
  const data = (await response.json()) as unknown;
  return parseBatchResponse(data, titles.length);
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

export async function translateTitles(titles: string[]): Promise<void> {
  await loadMap();
  const unique = Array.from(new Set(titles.map((title) => title.trim()).filter((title) => isEnglishTitle(title) && !map[title])));
  if (unique.length === 0) return;

  const batches = chunk(unique, BATCH_SIZE);
  let cursor = 0;

  async function worker() {
    while (cursor < batches.length) {
      const current = batches[cursor++];
      try {
        const translated = await translateBatch(current);
        current.forEach((title, index) => {
          const zh = translated[index];
          if (zh && zh !== title) map[title] = zh;
        });
        schedulePersist();
      } catch (error) {
        console.warn('Translate batch failed:', error instanceof Error ? error.message : error);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(BATCH_CONCURRENCY, batches.length) }, () => worker()));
  await persistMap();
}

export function applyTranslation<T extends { title: string; titleZh?: string }>(item: T): T {
  if (item.titleZh) return item;
  const translated = map[item.title];
  if (!translated) return item;
  return { ...item, titleZh: translated };
}

export async function hydrateTranslations<T extends { title: string; titleZh?: string }>(
  items: T[],
  options?: { immediate?: number }
): Promise<T[]> {
  await loadMap();
  const applied = items.map((item) => applyTranslation(item));
  const missing = applied.filter((item) => !item.titleZh && isEnglishTitle(item.title)).map((item) => item.title);
  if (missing.length === 0) return applied;

  const immediate = options?.immediate ?? missing.length;
  await translateTitles(missing.slice(0, immediate));
  const ready = applied.map((item) => applyTranslation(item));

  if (missing.length > immediate) {
    void translateTitles(missing.slice(immediate));
  }
  return ready;
}

export function startBackgroundTranslation(titles: string[]) {
  if (translatingAll) return;
  translatingAll = true;
  void translateTitles(titles).finally(() => {
    translatingAll = false;
  });
}
