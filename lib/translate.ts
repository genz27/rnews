import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const BATCH_SIZE = 32;
const BATCH_CONCURRENCY = process.env.VERCEL ? 3 : 6;

type TranslationMap = Record<string, string>;

let map: TranslationMap = {};
let loaded = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let translationSink: (() => void) | null = null;
const inflightTitles = new Set<string>();

export function setTranslationSink(fn: () => void) {
  translationSink = fn;
}

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
  if (cjk >= 2) return false;
  if (letters < 8) return false;
  return true;
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
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
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
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`translate HTTP ${response.status}`);
      }
      if (!response.ok) {
        throw new Error(`translate HTTP ${response.status}`);
      }
      const data = (await response.json()) as unknown;
      return parseBatchResponse(data, titles.length);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('translate failed');
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

export async function translateTitles(titles: string[]): Promise<void> {
  await loadMap();
  const unique = Array.from(
    new Set(
      titles
        .map((title) => title.trim())
        .filter((title) => isEnglishTitle(title) && !map[title] && !inflightTitles.has(title))
    )
  );
  if (unique.length === 0) return;
  unique.forEach((title) => inflightTitles.add(title));

  try {
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
          translationSink?.();
        } catch (error) {
          console.warn('Translate batch failed:', error instanceof Error ? error.message : error);
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(BATCH_CONCURRENCY, batches.length) }, () => worker()));
    await persistMap();
  } finally {
    unique.forEach((title) => inflightTitles.delete(title));
  }
}

export function lookupTranslation(title: string): string | undefined {
  return map[title] || map[title.trim()];
}

export function applyTranslation<T extends { title: string; titleZh?: string }>(item: T): T {
  if (item.titleZh && item.titleZh !== item.title) return item;
  const translated = lookupTranslation(item.title);
  if (!translated || translated === item.title) return item;
  return { ...item, titleZh: translated };
}
