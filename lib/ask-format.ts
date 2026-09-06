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

function sourceFromUrl(href: string, title = '') {
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    return { href, host, title: title || host };
  } catch {
    return null;
  }
}

function pushSource(list: AskSource[], href: string, title = '') {
  const next = sourceFromUrl(href, title);
  if (!next) return;
  if (list.some((item) => item.href === next.href)) {
    if (title && !list.find((item) => item.href === next.href)?.title) {
      const current = list.find((item) => item.href === next.href);
      if (current) current.title = title;
    }
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
  const pattern = new RegExp(`(?:^|\\n)(?:#{1,3}\\s*)?${heading}\\s*\\n([\\s\\S]+)$`, 'i');
  const match = pattern.exec(text);
  if (!match || match.index < 0) return { body: text, block: '' };
  return { body: text.slice(0, match.index).trim(), block: match[1].trim() };
}

function parseFollowups(block: string) {
  return block
    .split('\n')
    .map((line) => line.replace(/^[-*・·\d.、)\s]+/, '').trim())
    .filter((line) => line && !/^https?:\/\//.test(line) && line.length < 40)
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

export function parseAskAnswer(markdown: string, extraUrls: string[] = []): ParsedAskAnswer {
  const sources: AskSource[] = [];
  let text = markdown.replace(/\r\n/g, '\n').trim();

  const followSplit = splitBlock(text, '追问');
  const followups = parseFollowups(followSplit.block);
  text = followSplit.body;

  const sourceSplit = splitBlock(text, '来源');
  parseSourceLines(sourceSplit.block, sources);
  text = sourceSplit.body;

  collectLinks(text, sources);
  for (const url of extraUrls) pushSource(sources, url);

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
