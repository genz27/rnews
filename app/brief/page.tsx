import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BriefFallback } from '@/components/BriefFallback';
import { BriefPanel } from '@/components/BriefPanel';
import { BriefView } from '@/components/BriefView';
import { getDailyBrief } from '@/lib/brief';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '今日日报 · Rnews',
  description: '半日新闻摘要',
};

export default function BriefPage() {
  return (
    <BriefView>
      <Suspense fallback={<BriefFallback />}>
        <BriefLoader />
      </Suspense>
    </BriefView>
  );
}

async function BriefLoader() {
  const initialBrief = await getDailyBrief();
  return <BriefPanel initialBrief={initialBrief} showHeading={false} />;
}
