'use client';

import { AskSearch } from '@/components/AskSearch';
import { PageShell } from '@/components/PageShell';
import { useCallback, useRef, useState } from 'react';

export function AskView({ initialQuery = '', autoAsk = false }: { initialQuery?: string; autoAsk?: boolean }) {
  const clearRef = useRef<(() => void) | null>(null);
  const [active, setActive] = useState(false);
  const handleActive = useCallback((next: boolean) => setActive(next), []);

  return (
    <PageShell
      title="AI 搜索"
      subtitle="有问题就搜"
      searchActive
      hideTitle
      hidePills
      hideSideNav
      headerRight={
        active ? (
          <button
            type="button"
            onClick={() => clearRef.current?.()}
            className="px-1.5 text-sm text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            新搜索
          </button>
        ) : null
      }
    >
      <AskSearch initialQuery={initialQuery} autoAsk={autoAsk} onClearRef={clearRef} onActiveChange={handleActive} />
    </PageShell>
  );
}
