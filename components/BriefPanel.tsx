'use client';

import { MarkdownText } from '@/components/MarkdownText';
import { formatUpdatedAt } from '@/lib/time';
import { DailyBrief } from '@/lib/types';
import { useEffect, useState } from 'react';

export function BriefPanel({
  initialBrief = null,
  fill = false,
  reloadToken = 0,
  showHeading = true,
}: {
  initialBrief?: DailyBrief | null;
  fill?: boolean;
  reloadToken?: number;
  showHeading?: boolean;
}) {
  const [brief, setBrief] = useState<DailyBrief | null>(initialBrief);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(!initialBrief);

  const load = async (refresh = false) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(refresh ? '/api/brief?refresh=1' : '/api/brief', {
        cache: refresh ? 'no-store' : 'default',
      });
      const data = (await response.json()) as DailyBrief & { error?: string };
      if (!response.ok) throw new Error(data.error || '加载失败');
      setBrief(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '加载失败');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (initialBrief && reloadToken === 0) return;
    void load(false);
  }, [initialBrief, reloadToken]);

  return (
    <section id="brief" className={fill ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : undefined}>
      <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-3">
        {showHeading ? (
          <h2 className="text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-50">今日日报</h2>
        ) : (
          <span />
        )}
        <p className="text-sm text-zinc-500">
          {brief ? (
            <>
              {brief.date} · {brief.mode === 'llm' ? 'AI 摘要' : '摘录'}
              {brief.generatedAt ? ` · ${formatUpdatedAt(brief.generatedAt)}` : ''}
            </>
          ) : (
            <span>{busy ? '正在整理半日摘要…' : '还没有日报'}</span>
          )}
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={busy}
            className="ml-3 text-zinc-500 transition hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
          >
            重新生成
          </button>
        </p>
      </div>
      {error ? <p className="mt-3 shrink-0 text-sm text-zinc-500">{error}</p> : null}
      {brief ? (
        <div className={fill ? 'mt-3 min-h-0 flex-1 overflow-hidden' : 'mt-4'}>
          <MarkdownText text={brief.markdown} compact={fill} />
        </div>
      ) : null}
    </section>
  );
}
