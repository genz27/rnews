import type { Metadata } from 'next';
import { DocsView } from '@/components/DocsView';

export const metadata: Metadata = {
  title: 'API 文档 · Rnews',
  description: 'Rnews 公开 RSS 聚合接口说明，支持 JSON 与 RSS 输出。',
};

export default function DocsPage() {
  return <DocsView />;
}
