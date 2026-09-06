import type { Metadata } from 'next';
import { BriefView } from '@/components/BriefView';

export const metadata: Metadata = {
  title: '日报 · Rnews',
  description: '今日聚合资讯的 AI 新闻总结。',
};

export default function BriefPage() {
  return <BriefView />;
}
