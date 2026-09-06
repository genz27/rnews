'use client';

import { PageShell } from '@/components/PageShell';
import { ReactNode } from 'react';

export function BriefView({ children }: { children: ReactNode }) {
  return (
    <PageShell title="今日日报" subtitle="半日新闻摘要" briefActive>
      {children}
    </PageShell>
  );
}
