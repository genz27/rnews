import { BriefFallback } from '@/components/BriefFallback';
import { BriefView } from '@/components/BriefView';

export default function BriefLoading() {
  return (
    <BriefView>
      <BriefFallback />
    </BriefView>
  );
}
