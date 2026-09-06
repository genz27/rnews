'use client';

import { AskSearch } from '@/components/AskSearch';
import { PageShell } from '@/components/PageShell';

export function SearchView({ initialQuery = '' }: { initialQuery?: string }) {
  return (
    <PageShell title="搜索" subtitle="先检索今日条目，再生成回答" searchActive>
      <div className="mt-6">
        <AskSearch initialQuery={initialQuery} autoAsk={Boolean(initialQuery.trim())} />
      </div>
    </PageShell>
  );
}
