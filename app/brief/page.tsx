import type { Metadata } from 'next';
import { BriefView } from '@/components/BriefView';
import { readCachedBrief } from '@/lib/brief';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '今日日报 · Rnews',
  description: '半日新闻摘要',
};

export default async function BriefPage() {
  const initialBrief = await readCachedBrief();
  return <BriefView initialBrief={initialBrief} />;
}
