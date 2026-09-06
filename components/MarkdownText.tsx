function renderInline(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
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
    return <span key={index}>{part}</span>;
  });
}

export function MarkdownText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <div className="space-y-3 text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
      {blocks.map((block, index) => {
        const lines = block.split('\n');
        if (lines.every((line) => /^[-*]\s/.test(line))) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.replace(/^[-*]\s/, ''))}</li>
              ))}
            </ul>
          );
        }
        if (/^###\s/.test(block)) {
          return (
            <h3 key={index} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {renderInline(block.replace(/^###\s/, ''))}
            </h3>
          );
        }
        if (/^##\s/.test(block)) {
          return (
            <h2 key={index} className="text-base font-medium text-zinc-900 dark:text-zinc-100">
              {renderInline(block.replace(/^##\s/, ''))}
            </h2>
          );
        }
        if (/^#\s/.test(block)) {
          return (
            <h1 key={index} className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {renderInline(block.replace(/^#\s/, ''))}
            </h1>
          );
        }
        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {renderInline(line)}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
