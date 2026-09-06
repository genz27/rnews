import { mkdir, readFile, writeFile } from 'fs/promises';
import { revalidateTag, unstable_cache } from 'next/cache';
import path from 'path';
import { completeChat } from './llm';
import { formatNewsContext } from './news-search';
import { fetchAllFeeds, filterItems } from './rss';
import { shanghaiDay } from './time';
import { applyTranslation } from './translate';
import { DailyBrief, FeedItem } from './types';

export type { DailyBrief };

export const BRIEF_TAG = 'rnews-daily-brief';
export const BRIEF_TTL_MS = 12 * 60 * 60 * 1000;
const BRIEF_REVALIDATE_SECONDS = Math.floor(BRIEF_TTL_MS / 1000);

const AI_HINT =
  /ai|gpt|openai|claude|gemini|llm|agent|agi|mcp|rag|deepseek|grok|anthropic|huggingface|codex|openclaw|智能体|大模型|机器学习/i;

let memory: DailyBrief | null = null;

type BriefPool = {
  items: FeedItem[];
  checked: number;
  ok: number;
};

function briefPath(date: string) {
  if (process.env.VERCEL) return path.join('/tmp', `rnews-brief-${date}.json`);
  return path.join(process.cwd(), '.data', `brief-${date}.json`);
}

function isFresh(brief: DailyBrief, date: string) {
  return brief.date === date && Date.now() - brief.generatedAt < BRIEF_TTL_MS;
}

function shortSource(source: string) {
  const next = source
    .replace(/\s*(首页|最佳|最新话题|热门话题|最热|技术|Ask|Show)$/u, '')
    .replace(/\s*(博客| Releases| Commits)$/iu, '')
    .trim();
  return next || source;
}

function isAiItem(item: FeedItem) {
  if (item.category === 'AI') return true;
  return AI_HINT.test(`${item.title} ${item.titleZh || ''} ${item.snippet || ''} ${item.source}`);
}

function oneLine(item: FeedItem) {
  const title = (item.titleZh || item.title).replace(/\s+/g, ' ').trim();
  const snippet = (item.snippet || '').replace(/\s+/g, ' ').trim();
  const fact = snippet && !title.includes(snippet.slice(0, 18)) ? `${title}。${snippet}` : title;
  return `・${shortSource(item.source)} ${fact} ${item.link}`;
}

function feedFooter(checked: number, ok: number, selected: number) {
  return `来源：${checked} feeds 检查 / ${ok} feeds 成功 / ${selected} 条精选`;
}

function countPicks(markdown: string) {
  return (markdown.match(/^[・·]\s*/gm) || []).length;
}

function withFooter(markdown: string, checked: number, ok: number, selected: number) {
  const footer = feedFooter(checked, ok, selected);
  const cleaned = markdown
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^📰.*$/gm, '')
    .replace(/^─{3,}.*$/gm, '')
    .replace(/来源：\s*\d+\s*feeds[^\n]*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return `${cleaned}\n${footer}`;
}

export function extractBrief(date: string, items: FeedItem[], checked: number, ok: number): DailyBrief {
  const ai: FeedItem[] = [];
  const other: FeedItem[] = [];
  for (const item of items) {
    (isAiItem(item) ? ai : other).push(item);
  }

  const aiLines = ai.slice(0, 18).map(oneLine);
  const otherLines = other.slice(0, 16).map(oneLine);
  const selected = aiLines.length + otherLines.length;
  const lines = ['AI 焦点', ...aiLines, '其他资讯', ...otherLines, feedFooter(checked, ok, selected)];

  return {
    date,
    generatedAt: Date.now(),
    mode: 'extract',
    markdown: lines.filter(Boolean).join('\n'),
    itemCount: selected,
    feedsChecked: checked,
    feedsOk: ok,
  };
}

async function todayPool(limit = 64): Promise<BriefPool> {
  const snapshot = await fetchAllFeeds();
  const today = filterItems(snapshot.items, '推荐').map((item) => applyTranslation(item));
  const source = today.length >= 8 ? today : snapshot.items.map((item) => applyTranslation(item));
  return {
    items: source.slice(0, limit),
    checked: snapshot.sources,
    ok: snapshot.ok,
  };
}

async function writeBrief(brief: DailyBrief) {
  memory = brief;
  try {
    const file = briefPath(brief.date);
    await mkdir(/* turbopackIgnore: true */ path.dirname(file), { recursive: true });
    await writeFile(/* turbopackIgnore: true */ file, JSON.stringify(brief));
  } catch {
    /* ignore */
  }
}

async function readBrief(date: string): Promise<DailyBrief | null> {
  if (memory && isFresh(memory, date)) return memory;
  try {
    const raw = await readFile(/* turbopackIgnore: true */ briefPath(date), 'utf8');
    const parsed = JSON.parse(raw) as DailyBrief;
    if (parsed?.markdown && isFresh(parsed, date)) {
      memory = parsed;
      return parsed;
    }
  } catch {
    /* miss */
  }
  return null;
}

export async function readCachedBrief(): Promise<DailyBrief | null> {
  return readBrief(shanghaiDay());
}

async function generateDailyBrief(): Promise<DailyBrief> {
  const date = shanghaiDay();
  const pool = await todayPool(64);
  const fallback = extractBrief(date, pool.items, pool.checked, pool.ok);
  if (pool.items.length === 0) {
    await writeBrief(fallback);
    return fallback;
  }

  try {
    const sample = pool.items.slice(0, 48);
    const markdown = await completeChat({
      maxTokens: 2200,
      messages: [
        {
          role: 'system',
          content:
            '你是半日新闻摘要编辑。只能使用用户给出的 RSS 条目，禁止编造未出现的新闻、链接或来源。不要自我介绍，不要加标题、不要写今日观察、不要用 markdown 标题。',
        },
        {
          role: 'user',
          content: `日期：${date}
请写成半日新闻摘要，格式必须严格如下：

AI 焦点
・来源名 一句话事实。原文链接
・来源名 一句话事实。原文链接

其他资讯
・来源名 一句话事实。原文链接

来源：${pool.checked} feeds 检查 / ${pool.ok} feeds 成功 / {n} 条精选

规则：
- 每条一行，以「・」开头
- 来源名用条目的 source，可略去「首页/最新」等后缀
- 一句话尽量短，写关键事实，不要空话
- 必须使用条目里的真实链接，不要改写 URL
- AI 焦点：模型、智能体、大厂 AI、开源 agent 相关，约 12-18 条
- 其他资讯：安全、硬件、产品、商业等，约 10-16 条
- 总共不超过 32 条，不要重复
- 最后一行 {n} 改成实际精选条数

条目：
${formatNewsContext(sample)}`,
        },
      ],
    });
    const grounded = sample.filter((item) => markdown.includes(item.link)).length;
    if (markdown.length > 40 && grounded >= 3) {
      const selected = countPicks(markdown) || fallback.itemCount;
      const brief: DailyBrief = {
        date,
        generatedAt: Date.now(),
        mode: 'llm',
        markdown: withFooter(markdown, pool.checked, pool.ok, selected),
        itemCount: selected,
        feedsChecked: pool.checked,
        feedsOk: pool.ok,
      };
      await writeBrief(brief);
      return brief;
    }
  } catch (error) {
    console.warn('Daily brief LLM failed:', error instanceof Error ? error.message : error);
  }

  await writeBrief(fallback);
  return fallback;
}

const loadSharedBrief = unstable_cache(
  async (date: string) => {
    const local = await readBrief(date);
    if (local) return local;
    return generateDailyBrief();
  },
  ['rnews-daily-brief'],
  { revalidate: BRIEF_REVALIDATE_SECONDS, tags: [BRIEF_TAG] }
);

export async function getDailyBrief(options?: { refresh?: boolean }): Promise<DailyBrief> {
  const date = shanghaiDay();
  if (options?.refresh) {
    revalidateTag(BRIEF_TAG, { expire: 0 });
    return generateDailyBrief();
  }

  const local = await readBrief(date);
  if (local) return local;
  return loadSharedBrief(date);
}
