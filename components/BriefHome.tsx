import { Suspense } from 'react';
import { BriefFallback } from '@/components/BriefFallback';
import { BriefPanel } from '@/components/BriefPanel';
import { BriefView } from '@/components/BriefView';
import { getDailyBrief } from '@/lib/brief';

export function BriefHome() {
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
