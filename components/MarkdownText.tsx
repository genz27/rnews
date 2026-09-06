import { memo, type ReactNode } from 'react';

const SECTION = /^(AI 焦点|其他资讯|今日要点|今日观察|来源|追问)$/;
const LIST = /^[-*・·]\s*/;
const FOOTER = /^来源：/;
const RULE = /^(─{3,}|-{3,})$/;

function trimUrl(url: string) {
  return url.replace(/[)，。,.!！?？;；]+$/g, '');
}

const badgeClass =
  'mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-zinc-100 px-1 align-super text-[10px] leading-none text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:bg-white/[0.08] dark:text-zinc-400 dark:hover:bg-white/[0.14] dark:hover:text-zinc-200';

function citationBadge(
  label: string,
  href: string,
  key: number,
  onCite?: (index: number, href: string) => void
) {
  const index = Number(String(label).replace(/\D/g, '')) - 1;
  if (onCite && index >= 0) {
    return (
      <button key={key} type="button" onClick={() => onCite(index, href)} className={badgeClass}>
        {label}
      </button>
    );
  }
  return (
    <a key={key} href={href} target="_blank" rel="noopener noreferrer" className={badgeClass}>
      {label}
    </a>
  );
}

function renderInline(
  text: string,
  compact = false,
  sources: Array<{ href: string }> = [],
  onCite?: (index: number, href: string) => void
) {
  const parts = text.split(/(\[\[[^\]]+\]\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|\[\d+\]|\*\*[^*]+\*\*|https?:\/\/[^\s<>"']+)/g);
  return parts.map((part, index) => {
    const numbered = /^\[\[([^\]]+)\]\]\(([^)]+)\)$/.exec(part) || /^\[(\d+)\]\(([^)]+)\)$/.exec(part);
    if (numbered) return citationBadge(numbered[1], numbered[2], index, onCite);
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      if (/^\[?\d+\]?$/.test(link[1].trim())) {
        return citationBadge(link[1].replace(/\D/g, '') || link[1], link[2], index, onCite);
      }
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
    const bare = /^\[(\d+)\]$/.exec(part);
    if (bare) {
      const source = sources[Number(bare[1]) - 1];
      if (source) return citationBadge(bare[1], source.href, index, onCite);
    }
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    if (/^https?:\/\//.test(part)) {
      const href = trimUrl(part);
      const trailing = part.slice(href.length);
      let label = '原文';
      if (!compact) {
        try {
          label = new URL(href).hostname.replace(/^www\./, '');
        } catch {
          label = '原文';
        }
      }
      return (
        <span key={index}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:decoration-white/20 dark:hover:text-zinc-100"
          >
            {label}
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

function MarkdownBody({
  text,
  compact = false,
  sources = [],
  onCite,
}: {
  text: string;
  compact?: boolean;
  sources?: Array<{ href: string }>;
  onCite?: (index: number, href: string) => void;
}) {
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
          {renderInline(headingText(lines[index]), compact, sources, onCite)}
        </h3>
      );
      index += 1;
      continue;
    }
    if (kind === 'footer') {
      blocks.push(
        <p key={`f-${index}`} className="pt-2 text-xs text-zinc-400 dark:text-zinc-500">
          {renderInline(lines[index].trim(), compact, sources, onCite)}
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
            <li key={itemIndex} className="brief-row flex gap-2">
              <span className="shrink-0 text-zinc-400">・</span>
              <span className="min-w-0">{renderInline(item, compact, sources, onCite)}</span>
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
            {renderInline(line, compact, sources, onCite)}
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

export const MarkdownText = memo(MarkdownBody);
MarkdownText.displayName = 'MarkdownText';
