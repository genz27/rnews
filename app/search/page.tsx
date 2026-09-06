import { redirect } from 'next/navigation';

type PageProps = {
  searchParams: Promise<{ q?: string; ask?: string }>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = (params.q || params.ask || '').trim();
  redirect(query ? `/ask?q=${encodeURIComponent(query)}` : '/ask');
}
