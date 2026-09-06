export type AskSource = {
  href: string;
  host: string;
  title: string;
};

export type ParsedAskAnswer = {
  body: string;
  sources: AskSource[];
  followups: string[];
};

const GENERIC_SLUG = /^(index|home|news|latest|story|article|post|item|id|wiki|portal|current|events|watch|v|video)$/i;
const NOISY_HOST = /(news\.google\.com|news\.yahoo\.com|google\.com\/search)$/i;

function usableLabel(text: string, host: string) {
  const cleaned = text
    .replace(/^\[?\[?\d+\]?\]?$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned || cleaned.toLowerCase() === host.toLowerCase() || /^https?:/i.test(cleaned)) return '';
  if (cleaned.length <= 1) return '';
  if (cleaned.length === 2 && !/[\u3400-\u9fff]/.test(cleaned)) return '';
  return cleaned.slice(0, 56);
}

function slugTitle(href: string, host: string) {
  if (NOISY_HOST.test(host)) return '';
  try {
    const url = new URL(href);
    const parts = url.pathname.split('/').filter(Boolean);
    const last = decodeURIComponent(parts[parts.length - 1] || '').replace(/\.(html?|php|aspx)$/i, '');
    const pretty = last.replace(/[-_]+/g, ' ').trim();
    if (!pretty || GENERIC_SLUG.test(pretty) || /^\d+$/.test(pretty) || /^\d{4}([-\s.]\d{2}){1,2}$/.test(pretty)) {
      return '';
    }
    return usableLabel(pretty, host);
  } catch {
    return '';
  }
}

function prettyTitle(href: string, host: string, title = '') {
  return usableLabel(title, host) || slugTitle(href, host) || host;
}

function sourceFromUrl(href: string, title = '') {
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    return { href, host, title: prettyTitle(href, host, title) };
  } catch {
    return null;
  }
}

function titleScore(title: string, host: string) {
  if (!title || title === host) return 0;
  const hasCjk = /[\u3400-\u9fff]/.test(title);
  const hasSpace = /\s/.test(title);
  if (hasSpace || (hasCjk && title.length > 4)) return 30 + Math.min(title.length, 40);
  if (hasCjk) return 16 + title.length;
  if (title.length <= 16 && !/[/.]/.test(title)) return 10 + title.length;
  return 6 + Math.min(title.length, 20);
}

function isBetterTitle(next: string, current: string, host: string) {
  return titleScore(next, host) > titleScore(current, host);
}

function pushSource(list: AskSource[], href: string, title = '') {
  const next = sourceFromUrl(href, title);
  if (!next) return;
  const existing = list.find((item) => item.href === next.href);
  if (existing) {
    if (isBetterTitle(next.title, existing.title, existing.host)) existing.title = next.title;
    return;
  }
  if (list.length >= 8) return;
  list.push(next);
}

function collectLinks(text: string, list: AskSource[]) {
  const md = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = md.exec(text))) {
    pushSource(list, match[2], match[1].replace(/^\[?\[?\d+\]?\]?$/, '').trim());
  }
  const raw = text.match(/https?:\/\/[^\s)\]>'"]+/g) || [];
  for (const item of raw) {
    pushSource(list, item.replace(/[)，。,.!！?？;；]+$/g, ''));
  }
}

function splitBlock(text: string, heading: string) {
  const pattern = new RegExp(
    `(?:^|\\n)(?:#{1,6}\\s*)?(?:\\*{1,3}|_{1,3})?\\s*${heading}\\s*(?:\\*{1,3}|_{1,3})?\\s*[:：]?\\s*\\n([\\s\\S]+)$`,
    'i'
  );
  const match = pattern.exec(text);
  if (!match || match.index < 0) return { body: text, block: '' };
  return { body: text.slice(0, match.index).trim(), block: match[1].trim() };
}

function parseFollowups(block: string) {
  return block
    .split('\n')
    .map((line) => line.replace(/^[-*・·\d.、)\s]+/, '').trim())
    .filter((line) => line && !/^https?:\/\//.test(line) && line.length <= 64)
    .slice(0, 3);
}

function parseSourceLines(block: string, list: AskSource[]) {
  for (const raw of block.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const md = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/.exec(line);
    if (md) {
      pushSource(list, md[2], md[1]);
      continue;
    }
    const pipe = /^(?:\d+[\.、)]\s*)?(.+?)\s*[|｜]\s*(https?:\/\/\S+)/.exec(line);
    if (pipe) {
      pushSource(list, pipe[2], pipe[1].replace(/^[\[【]+|[\]】]+$/g, '').trim());
      continue;
    }
    const url = /(https?:\/\/\S+)/.exec(line);
    if (url) pushSource(list, url[1], line.replace(url[1], '').replace(/^[\d\.、)\s]+/, '').trim());
  }
}

export function parseAskAnswer(
  markdown: string,
  extra: Array<string | { href: string; title?: string }> = []
): ParsedAskAnswer {
  const sources: AskSource[] = [];
  let text = markdown.replace(/\r\n/g, '\n').trim();

  const followSplit = splitBlock(text, '追问');
  const followups = parseFollowups(followSplit.block);
  text = followSplit.body;

  const sourceSplit = splitBlock(text, '来源');
  parseSourceLines(sourceSplit.block, sources);
  text = sourceSplit.body;

  collectLinks(text, sources);
  for (const item of extra) {
    if (typeof item === 'string') pushSource(sources, item);
    else pushSource(sources, item.href, item.title || '');
  }

  return {
    body: text.trim(),
    sources,
    followups,
  };
}

export function fallbackFollowups(query: string) {
  const q = query.replace(/[？?！!。.\s]+$/g, '').trim();
  if (q && q.length <= 12) return [`${q} 还有哪些细节`, `${q} 为什么重要`, '相关的还有什么'];
  return ['还有哪些关键细节', '为什么现在发生', '相关的还有什么'];
}
