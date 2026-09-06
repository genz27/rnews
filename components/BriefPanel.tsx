'use client';

import { MarkdownText } from '@/components/MarkdownText';
import { formatUpdatedAt } from '@/lib/time';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Brief = {
  date: string;
  generatedAt: number;
  markdown: string;
  itemCount: number;
};

export function BriefPanel() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const load = async (refresh = false) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(refresh ? '/api/brief?refresh=1' : '/api/brief', { cache: 'no-store' });
      const data = (await response.json()) as Brief & { error?: string };
      if (!response.ok) throw new Error(data.error || '加载失败');
      setBrief(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '加载失败');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load(false);
  }, []);

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-50">今日日报</h2>
        <p className="text-sm text-zinc-500">
          {brief ? (
            <>
              {brief.date} · {brief.itemCount} 条 · {formatUpdatedAt(brief.generatedAt)}
            </>
          ) : (
            <span>{busy ? '正在整理今日条目…' : '还没有日报'}</span>
          )}
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={busy}
            className="ml-3 text-zinc-500 transition hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
          >
            重新生成
          </button>
          <span className="text-zinc-300 dark:text-zinc-700"> · </span>
          <Link href="/brief" className="text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200">
            完整日报
          </Link>
        </p>
      </div>
      {error ? <p className="mt-4 text-sm text-zinc-500">{error}</p> : null}
      {brief ? (
        <div className="mt-4">
          <MarkdownText text={brief.markdown} />
        </div>
      ) : null}
    </section>
  );
}
