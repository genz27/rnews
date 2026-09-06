'use client';

import { AskSearch } from '@/components/AskSearch';
import { PageShell } from '@/components/PageShell';
import { useRef } from 'react';

export function AskView({ initialQuery = '', autoAsk = false }: { initialQuery?: string; autoAsk?: boolean }) {
  const clearRef = useRef<(() => void) | null>(null);

  return (
    <PageShell
      title="AI 搜索"
      subtitle="可持续对话，刷新也不会丢"
      searchActive
      fullHeight
      hideMobileBack
      headerRight={
        <button
          type="button"
          onClick={() => clearRef.current?.()}
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          新对话
        </button>
      }
    >
      <AskSearch persist layout="page" initialQuery={initialQuery} autoAsk={autoAsk} onClearRef={clearRef} />
    </PageShell>
  );
}
