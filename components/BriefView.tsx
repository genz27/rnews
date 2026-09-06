'use client';

import { BriefPanel } from '@/components/BriefPanel';
import { PageShell } from '@/components/PageShell';
import { DailyBrief } from '@/lib/types';

export function BriefView({ initialBrief = null }: { initialBrief?: DailyBrief | null }) {
  return (
    <PageShell title="今日日报" subtitle="半日新闻摘要" briefActive>
      <div className="lg:mt-6">
        <BriefPanel initialBrief={initialBrief} showHeading={false} />
      </div>
    </PageShell>
  );
}
