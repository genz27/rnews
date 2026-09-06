import type { Metadata } from 'next';
import { SearchView } from '@/components/SearchView';

export const metadata: Metadata = {
  title: '搜索 · Rnews',
  description: '检索今日聚合资讯并流式回答。',
};

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <SearchView initialQuery={(params.q || '').trim()} />;
}
