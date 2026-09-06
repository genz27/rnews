'use client';

import { FeedRow } from '@/components/FeedCard';
import { MarkdownText } from '@/components/MarkdownText';
import { PageShell } from '@/components/PageShell';
import { formatUpdatedAt } from '@/lib/time';
import { FeedItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Brief = {
  date: string;
  generatedAt: number;
  mode: 'llm' | 'extract';
  markdown: string;
  itemCount: number;
  items?: FeedItem[];
};

export function BriefView() {
  const router = useRouter();
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
    <PageShell title="日报" subtitle="根据今日聚合条目整理的新闻总结" briefActive>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        {brief ? (
          <span>
            {brief.date} · {brief.itemCount} 条 · {formatUpdatedAt(brief.generatedAt)}
          </span>
        ) : (
          <span>{busy ? '正在整理今日条目…' : '还没有日报'}</span>
        )}
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={busy}
          className="text-zinc-500 transition hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
        >
          重新生成
        </button>
      </div>
      {error ? <p className="mt-6 text-sm text-zinc-500">{error}</p> : null}
      {brief ? (
        <div className="mt-6">
          <MarkdownText text={brief.markdown} />
        </div>
      ) : null}
      {brief?.items && brief.items.length > 0 ? (
        <section className="mt-10">
          <p className="mb-2 text-xs text-zinc-400 lg:text-[13px] lg:text-zinc-500">
            今日条目 {brief.items.length} 条
          </p>
          {brief.items.map((item) => (
            <FeedRow
              key={item.id || item.link}
              item={item}
              onSource={(source) => router.push(`/?q=${encodeURIComponent(source)}`)}
              onCategory={(category) =>
                router.push(category === '推荐' ? '/' : `/?c=${encodeURIComponent(category)}`)
              }
            />
          ))}
        </section>
      ) : null}
    </PageShell>
  );
}
