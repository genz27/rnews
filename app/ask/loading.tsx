import { PageShell } from '@/components/PageShell';

export default function AskLoading() {
  return (
    <PageShell title="AI 搜索" subtitle="有问题就搜" searchActive hideTitle hidePills hideSideNav>
      <div className="mx-auto flex min-h-[calc(100dvh-14rem)] w-full max-w-2xl flex-col justify-center">
        <div className="mx-auto h-8 w-24 rounded skeleton-line" />
        <div className="mx-auto mt-3 h-4 w-48 rounded skeleton-line" />
        <div className="mt-8 h-24 w-full rounded-2xl skeleton-line" />
      </div>
    </PageShell>
  );
}
