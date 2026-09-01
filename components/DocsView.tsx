'use client';

import Link from 'next/link';
import { SideNav } from '@/components/SideNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getCatalogCategories } from '@/lib/catalog';

export function DocsView() {
  const categories = getCatalogCategories();

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8 lg:py-5">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight text-zinc-900 lg:text-2xl dark:text-zinc-50">
              Rnews
            </Link>
            <p className="mt-1 text-sm leading-6 text-zinc-500">公开聚合 API</p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-10">
        <aside className="hidden lg:block">
          <SideNav categories={categories} docsActive />
        </aside>
        <main className="min-w-0 max-w-3xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          <p className="lg:hidden mb-8">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
              ← 返回首页
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">API 文档</h1>
          <p className="mt-3">
            Rnews 把各站点 RSS 聚合成一份列表，除了网页阅读，也可以用 JSON 或标准 RSS 拉取。默认开启 CORS，可直接在浏览器或服务端调用。
          </p>

          <h2 className="mt-10 text-base font-medium text-zinc-900 dark:text-zinc-50">速率限制</h2>
          <p className="mt-2">
            公开接口 <code className="text-zinc-800 dark:text-zinc-200">/api/v1/*</code> 每个 IP 每分钟最多 <strong>60</strong> 次。超出返回 HTTP 429，并带上：
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><code>X-RateLimit-Limit</code></li>
            <li><code>X-RateLimit-Remaining</code></li>
            <li><code>X-RateLimit-Reset</code>（Unix 秒）</li>
            <li><code>Retry-After</code></li>
          </ul>
          <p className="mt-2">站点页面使用的内部接口限制更宽；全量刷新接口限制更严。</p>

          <h2 className="mt-10 text-base font-medium text-zinc-900 dark:text-zinc-50">分类</h2>
          <Code>{`GET /api/v1/categories`}</Code>
          <p className="mt-2">返回 <code>推荐</code>、<code>全部</code>、<code>社区</code>、<code>AI</code>、<code>资讯</code>、<code>工程</code>、<code>主机</code>。</p>

          <h2 className="mt-10 text-base font-medium text-zinc-900 dark:text-zinc-50">JSON 聚合</h2>
          <Code>{`GET /api/v1/feed?category=AI&q=&limit=40&cursor=0`}</Code>
          <p className="mt-2">参数：</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><code>category</code> 分类，默认 <code>全部</code>。<code>推荐</code> 为今日内容。</li>
            <li><code>q</code> 按标题、摘要或来源搜索</li>
            <li><code>limit</code> 每页条数，默认 40，最大 100</li>
            <li><code>cursor</code> 偏移，从 0 开始</li>
            <li><code>since</code> 只返回这个时间之后的条目，ISO 8601 或 Unix 时间戳。适合增量拉取，比较的是 <code>pubDate</code>，不含等于该时刻的条目。</li>
          </ul>
          <p className="mt-2">按发布时间倒序。英文标题会附带 <code>titleZh</code>。响应里的 <code>newestPubDate</code> 可以当作下一次请求的 <code>since</code>。</p>
          <Code>{`curl -s "https://news.airgzn.top/api/v1/feed?category=社区&limit=5"`}</Code>
          <Code>{`curl -s "https://news.airgzn.top/api/v1/feed?since=2026-09-01T00:00:00.000Z&limit=20"`}</Code>

          <h2 className="mt-10 text-base font-medium text-zinc-900 dark:text-zinc-50">RSS 输出</h2>
          <p className="mt-2">同一份聚合可以当普通 RSS 源订阅：</p>
          <Code>{`GET /api/v1/rss?category=资讯&limit=50&since=2026-09-01T00:00:00.000Z`}</Code>
          <Code>{`https://news.airgzn.top/api/v1/rss?category=全部`}</Code>
          <p className="mt-2">响应类型为 <code>application/rss+xml</code>，条目带一句 <code>description</code> 摘要，可直接丢进 RSS 阅读器。</p>

          <h2 className="mt-10 text-base font-medium text-zinc-900 dark:text-zinc-50">条目字段</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><code>id</code> 稳定标识</li>
            <li><code>title</code> 原文标题</li>
            <li><code>titleZh</code> 中文标题（若已翻译）</li>
            <li><code>snippet</code> 一句摘要（有则返回）</li>
            <li><code>link</code> 原文链接</li>
            <li><code>pubDate</code> ISO 时间</li>
            <li><code>source</code> 来源名称</li>
            <li><code>category</code> 归一化分类</li>
          </ul>

          <p className="mt-10">
            <Link href="/" className="text-zinc-800 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white">
              返回首页
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-md border border-zinc-200/80 bg-zinc-100/70 px-3 py-2.5 text-[13px] leading-6 text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
      <code>{children}</code>
    </pre>
  );
}
