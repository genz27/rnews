import type { Metadata } from 'next';
import { AskView } from '@/components/AskView';

export const metadata: Metadata = {
  title: 'AI 搜索 · Rnews',
  description: '用 AI 搜索资讯，并继续追问。',
};

type PageProps = {
  searchParams: Promise<{ q?: string; ask?: string }>;
};

export default async function AskPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = (params.q || params.ask || '').trim();
  return <AskView initialQuery={query} autoAsk={Boolean(query)} />;
}
