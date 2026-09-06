import type { ReactNode } from 'react';

const SECTION = /^(AI 焦点|其他资讯|今日要点|今日观察)$/;
const LIST = /^[-*・·]\s*/;
const FOOTER = /^来源：/;
const RULE = /^(─{3,}|-{3,})$/;

function trimUrl(url: string) {
  return url.replace(/[)，。,.!！?？;；]+$/g, '');
}

function renderInline(text: string, compact = false) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|https?:\/\/[^\s<>"']+)/g);
  return parts.map((part, index) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:decoration-white/20 dark:hover:text-zinc-100"
        >
          {link[1]}
        </a>
      );
    }
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    if (/^https?:\/\//.test(part)) {
      const href = trimUrl(part);
      const trailing = part.slice(href.length);
      return (
        <span key={index}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${compact ? '' : 'break-all '}underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:decoration-white/20 dark:hover:text-zinc-100`}
          >
            {compact ? '原文' : href}
          </a>
          {trailing}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function lineKind(line: string): 'empty' | 'rule' | 'heading' | 'list' | 'footer' | 'md-h' | 'text' {
  const trimmed = line.trim();
  if (!trimmed) return 'empty';
  if (RULE.test(trimmed)) return 'rule';
  if (SECTION.test(trimmed) || /^#{1,3}\s/.test(trimmed)) return /^#{1,3}\s/.test(trimmed) ? 'md-h' : 'heading';
  if (LIST.test(trimmed)) return 'list';
  if (FOOTER.test(trimmed)) return 'footer';
  return 'text';
}

function headingText(line: string) {
  return line.trim().replace(/^#{1,3}\s+/, '');
}

export function MarkdownText({ text, compact = false }: { text: string; compact?: boolean }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const kind = lineKind(lines[index]);
    if (kind === 'empty' || kind === 'rule') {
      index += 1;
      continue;
    }
    if (kind === 'heading' || kind === 'md-h') {
      const key = `h-${index}`;
      blocks.push(
        <h3 key={key} className={`font-medium text-zinc-900 dark:text-zinc-100 ${compact ? 'pt-0.5 text-[13px]' : 'pt-1 text-sm'}`}>
          {renderInline(headingText(lines[index]), compact)}
        </h3>
      );
      index += 1;
      continue;
    }
    if (kind === 'footer') {
      blocks.push(
        <p key={`f-${index}`} className="pt-2 text-xs text-zinc-400 dark:text-zinc-500">
          {renderInline(lines[index].trim(), compact)}
        </p>
      );
      index += 1;
      continue;
    }
    if (kind === 'list') {
      const items: string[] = [];
      const start = index;
      while (index < lines.length && lineKind(lines[index]) === 'list') {
        items.push(lines[index].trim().replace(LIST, ''));
        index += 1;
      }
      blocks.push(
        <ul key={`l-${start}`} className={`list-none pl-0 ${compact ? 'space-y-1' : 'space-y-2'}`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-2">
              <span className="shrink-0 text-zinc-400">・</span>
              <span className="min-w-0">{renderInline(item, compact)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    const start = index;
    const chunk: string[] = [];
    while (index < lines.length && lineKind(lines[index]) === 'text') {
      chunk.push(lines[index]);
      index += 1;
    }
    blocks.push(
      <p key={`p-${start}`}>
        {chunk.map((line, lineIndex) => (
          <span key={lineIndex}>
            {renderInline(line, compact)}
            {lineIndex < chunk.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  }

  return (
    <div
      className={
        compact
          ? 'flex h-full flex-col justify-between space-y-2 overflow-hidden text-[13px] leading-6 text-zinc-600 lg:text-[15px] lg:leading-7 dark:text-zinc-400'
          : 'space-y-3 text-[15px] leading-7 text-zinc-600 dark:text-zinc-400'
      }
    >
      {blocks}
    </div>
  );
}
