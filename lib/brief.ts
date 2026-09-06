import { mkdir, readFile, writeFile } from 'fs/promises';
import { revalidateTag, unstable_cache } from 'next/cache';
import path from 'path';
import { completeChat } from './llm';
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
  return (
    brief.date === date &&
    Date.now() - brief.generatedAt < BRIEF_TTL_MS &&
    countPicks(brief.markdown) > 0 &&
    countPicks(brief.markdown) <= 14
  );
}

function shortSource(source: string) {
  const next = source
    .replace(/\s*(首页|最佳|最新话题|热门话题|最热|技术|Ask|Show)$/u, '')
    .replace(/\s*(博客| Releases| Commits)$/iu, '')
    .trim();
  return next || source;
}

function isCommitNoise(item: FeedItem) {
  if (/\/commit\//i.test(item.link)) return true;
  if (/commits$/i.test(item.source)) return true;
  return /^(fix|feat|chore|perf|test|docs|refactor)\s*[\(:]/i.test(item.title);
}

function clipFact(text: string, max = 36) {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  const slice = compact.slice(0, max);
  const breakAt = Math.max(slice.lastIndexOf('。'), slice.lastIndexOf('，'), slice.lastIndexOf(' '));
  const cut = breakAt > max * 0.55 ? slice.slice(0, breakAt) : slice;
  return cut.replace(/[，,;；:\s]+$/g, '');
}

function pickBriefItems(items: FeedItem[], limit: number) {
  const usable = items.filter((item) => !isCommitNoise(item));
  const source = usable.length >= 12 ? usable : items;
  const picked: FeedItem[] = [];
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  for (const item of source) {
    const n = counts.get(item.source) || 0;
    if (n >= 3) continue;
    counts.set(item.source, n + 1);
    seen.add(item.id || item.link);
    picked.push(item);
    if (picked.length >= limit) return picked;
  }
  for (const item of source) {
    const key = item.id || item.link;
    if (seen.has(key)) continue;
    picked.push(item);
    if (picked.length >= limit) break;
  }
  return picked;
}

function isAiItem(item: FeedItem) {
  if (item.category === 'AI') return true;
  return AI_HINT.test(`${item.title} ${item.titleZh || ''} ${item.snippet || ''} ${item.source}`);
}

function oneLine(item: FeedItem) {
  const title = (item.titleZh || item.title).replace(/\s+/g, ' ').trim();
  return `・[${shortSource(item.source)} ${clipFact(title)}](${item.link})`;
}

function feedFooter(checked: number, ok: number, selected: number) {
  return `来源：${checked} feeds 检查 / ${ok} feeds 成功 / ${selected} 条精选`;
}

function mentionsLink(markdown: string, link: string) {
  if (markdown.includes(link)) return true;
  try {
    const url = new URL(link);
    const hostPath = `${url.host}${url.pathname}`.replace(/\/+$/, '');
    return hostPath.length > 16 && markdown.includes(hostPath);
  } catch {
    return false;
  }
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

  const aiLines = ai.slice(0, 6).map(oneLine);
  const otherLines = other.slice(0, 5).map(oneLine);
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

async function todayPool(limit = 22): Promise<BriefPool> {
  const snapshot = await fetchAllFeeds();
  const today = filterItems(snapshot.items, '推荐').map((item) => applyTranslation(item));
  const source = today.length >= 8 ? today : snapshot.items.map((item) => applyTranslation(item));
  return {
    items: pickBriefItems(source, limit),
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
  const pool = await todayPool(22);
  const fallback = extractBrief(date, pool.items, pool.checked, pool.ok);
  if (pool.items.length === 0) {
    await writeBrief(fallback);
    return fallback;
  }

  try {
    const sample = pool.items.slice(0, 20);
    const markdown = await completeChat({
      maxTokens: 700,
      timeoutMs: 40000,
      messages: [
        {
          role: 'system',
          content:
            '你是半日新闻摘要编辑。只根据给出的 RSS 条目做压缩总结，合并重复新闻，禁止编造。不要自我介绍，不要加标题或今日观察。',
        },
        {
          role: 'user',
          content: `日期：${date}
写成很短的半日摘要，必须刚好铺满一屏，不要写长。格式严格如下：

AI 焦点
・[来源名 一句结论](原文链接)
其他资讯
・[来源名 一句结论](原文链接)
来源：${pool.checked} feeds 检查 / ${pool.ok} feeds 成功 / {n} 条精选

规则：
- AI 焦点正好 6 条，其他资讯正好 5 条，总共 11 条
- 每条不超过 22 个汉字，只写结论，不要复述标题全文
- 同类新闻只留一条
- 必须用条目里的真实链接
- {n} 写成 11

条目：
${sample
  .map((item, index) => `${index + 1}. [${item.category}] ${item.source} ${item.titleZh || item.title}\n   ${item.link}`)
  .join('\n')}`,
        },
      ],
    });
    const grounded = sample.filter((item) => mentionsLink(markdown, item.link)).length;
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
    console.warn(`Daily brief not grounded (${grounded} links, ${markdown.length} chars)`);
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
