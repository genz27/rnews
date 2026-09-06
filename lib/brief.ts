import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { completeChat } from './llm';
import { formatNewsContext } from './news-search';
import { fetchAllFeeds, filterItems } from './rss';
import { shanghaiDay } from './time';
import { applyTranslation } from './translate';
import { DailyBrief, FeedItem } from './types';

export type { DailyBrief };

async function todayPool(limit = 40): Promise<FeedItem[]> {
  const snapshot = await fetchAllFeeds();
  const today = filterItems(snapshot.items, '推荐').map((item) => applyTranslation(item));
  const source = today.length >= 8 ? today : snapshot.items.map((item) => applyTranslation(item));
  return source.slice(0, limit);
}

async function withItems(brief: DailyBrief): Promise<DailyBrief> {
  if (brief.items && brief.items.length > 0) return brief;
  const items = await todayPool(18);
  const next = { ...brief, items, itemCount: brief.itemCount || items.length };
  memory = next;
  return next;
}

let memory: DailyBrief | null = null;

function briefPath(date: string) {
  if (process.env.VERCEL) return path.join('/tmp', `rnews-brief-${date}.json`);
  return path.join(process.cwd(), '.data', `brief-${date}.json`);
}

function extractBrief(date: string, items: FeedItem[]): DailyBrief {
  const groups = new Map<string, FeedItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) || [];
    if (list.length < 5) list.push(item);
    groups.set(item.category, list);
  }
  const lines = [`# ${date} 日报`, '', `今日收录 ${items.length} 条，按分类摘录如下。`, ''];
  for (const [category, list] of groups) {
    lines.push(`## ${category}`);
    for (const item of list) {
      const title = item.titleZh || item.title;
      const extra = item.snippet ? ` — ${item.snippet}` : '';
      lines.push(`- [${title}](${item.link})（${item.source}）${extra}`);
    }
    lines.push('');
  }
  return {
    date,
    generatedAt: Date.now(),
    mode: 'extract',
    markdown: lines.join('\n').trim(),
    itemCount: items.length,
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
  if (memory?.date === date) return memory;
  try {
    const raw = await readFile(/* turbopackIgnore: true */ briefPath(date), 'utf8');
    const parsed = JSON.parse(raw) as DailyBrief;
    if (parsed?.date === date && parsed.markdown) {
      memory = parsed;
      return parsed;
    }
  } catch {
    /* miss */
  }
  return null;
}

export async function readCachedBrief(): Promise<DailyBrief | null> {
  const cached = await readBrief(shanghaiDay());
  if (!cached) return null;
  return withItems(cached);
}

export async function getDailyBrief(options?: { refresh?: boolean }): Promise<DailyBrief> {
  const date = shanghaiDay();
  if (!options?.refresh) {
    const cached = await readBrief(date);
    if (cached) return withItems(cached);
  }

  const pool = await todayPool(40);
  const fallback = extractBrief(date, pool.slice(0, 36));
  fallback.items = pool.slice(0, 18);
  if (pool.length === 0) {
    await writeBrief(fallback);
    return fallback;
  }

  try {
    const sample = pool.slice(0, 28);
    const markdown = await completeChat({
      maxTokens: 1600,
      messages: [
        {
          role: 'system',
          content:
            '你是科技资讯编辑。只能使用用户给出的条目，标题和链接必须原样照抄，禁止编造、改写链接或补充列表外新闻。不要出现产品名或自我介绍。',
        },
        {
          role: 'user',
          content: `日期：${date}\n请输出：\n1. 先写 4-6 条今日要点\n2. 再按 社区 / AI / 资讯 / 工程 / 主机 分组，每组最多 4 条，格式「- [标题](链接)（来源）」\n3. 最后一段「今日观察」不超过 80 字。\n\n条目：\n${formatNewsContext(sample)}`,
        },
      ],
    });
    const grounded = sample.filter((item) => markdown.includes(item.link)).length;
    if (markdown.length > 40 && grounded >= 3) {
      const brief: DailyBrief = {
        date,
        generatedAt: Date.now(),
        mode: 'llm',
        markdown,
        itemCount: pool.length,
        items: pool.slice(0, 18),
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
