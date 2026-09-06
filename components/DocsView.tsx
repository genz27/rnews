'use client';

import { PageShell } from '@/components/PageShell';
import Link from 'next/link';

export function DocsView() {
  return (
    <PageShell title="API 文档" subtitle="公开聚合 API" docsActive>
      <div className="mt-3 max-w-3xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
        <p>
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
          <li><code>category</code> 分类，默认 <code>全部</code>。<code>推荐</code> 从今日内容里随机抽一批，刷新或下滑会换一批。</li>
          <li><code>q</code> 按标题、摘要或来源搜索</li>
          <li><code>limit</code> 每页条数，默认 40，最大 100</li>
          <li><code>cursor</code> 偏移，从 0 开始。推荐流不用这个分页。</li>
          <li><code>seed</code> 推荐流的随机种子，不传则每次现抽</li>
          <li><code>exclude</code> 推荐流排除的条目 id，逗号分隔</li>
          <li><code>since</code> 只返回这个时间之后的条目，ISO 8601 或 Unix 时间戳。适合增量拉取，比较的是 <code>pubDate</code>，不含等于该时刻的条目。</li>
        </ul>
        <p className="mt-2">按发布时间倒序。英文标题若已在后台译好，会附带 <code>titleZh</code>。响应里的 <code>newestPubDate</code> 可以当作下一次请求的 <code>since</code>。</p>
        <Code>{`curl -s "https://news.airgzn.top/api/v1/feed?category=社区&limit=5"`}</Code>
        <Code>{`curl -s "https://news.airgzn.top/api/v1/feed?since=2026-09-01T00:00:00.000Z&limit=20"`}</Code>

        <h2 className="mt-10 text-base font-medium text-zinc-900 dark:text-zinc-50">RSS 输出</h2>
        <p className="mt-2">同一份聚合可以当普通 RSS 源订阅：</p>
        <Code>{`GET /api/v1/rss?category=资讯&limit=50&since=2026-09-01T00:00:00.000Z`}</Code>
        <Code>{`https://news.airgzn.top/api/v1/rss?category=全部`}</Code>
        <p className="mt-2">响应类型为 <code>application/rss+xml</code>，条目带一句 <code>description</code> 摘要，可直接丢进 RSS 阅读器。</p>

        <h2 className="mt-10 text-base font-medium text-zinc-900 dark:text-zinc-50">AI 搜索</h2>
        <p className="mt-2">
          页面在 <Link href="/ask" className="text-zinc-800 underline decoration-zinc-300 underline-offset-2 dark:text-zinc-200">/ask</Link>
          。接口把问题和对话历史交给模型自带搜索，浏览器不会带密钥。每个 IP 每分钟 20 次。
        </p>
        <Code>{`POST /api/search
Content-Type: application/json

{
  "query": "今天有什么重要新闻",
  "images": [],
  "history": [
    { "role": "user", "content": "上一轮问题" },
    { "role": "assistant", "content": "上一轮回答" }
  ]
}`}</Code>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><code>query</code> 必填，最长 4000 字</li>
          <li><code>history</code> 可选，最近几轮，仅用于当次追问，页面不保存旧对话</li>
          <li><code>images</code> 可选，最多 6 张 <code>data:image/...</code></li>
        </ul>
        <p className="mt-2">
          响应为 <code>text/event-stream</code>。每条 <code>data:</code> 后是 JSON：
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><code>{`{"type":"delta","text":"..."}`}</code> 增量正文</li>
          <li><code>{`{"type":"citations","urls":["https://..."]}`}</code> 搜索来源</li>
          <li><code>{`{"type":"error","message":"..."}`}</code> 失败</li>
        </ul>
        <p className="mt-2">未配置模型时返回 503。超限返回 429。</p>
        <Code>{`curl -N -X POST https://news.airgzn.top/api/search \\
  -H "Content-Type: application/json" \\
  -d '{"query":"GPT-6 Astra 发布了什么"}'`}</Code>

        <h2 className="mt-10 text-base font-medium text-zinc-900 dark:text-zinc-50">今日日报</h2>
        <p className="mt-2">
          页面在 <Link href="/brief" className="text-zinc-800 underline decoration-zinc-300 underline-offset-2 dark:text-zinc-200">/brief</Link>
          。生成后缓存 12 小时，打开页面不会重跑模型。<code>refresh=1</code> 才重新生成。每个 IP 每分钟 30 次。
        </p>
        <Code>{`GET /api/brief`}</Code>
        <Code>{`GET /api/brief?refresh=1`}</Code>
        <p className="mt-2">JSON 字段：</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><code>date</code> 上海时区日期</li>
          <li><code>generatedAt</code> 生成时间（Unix 毫秒）</li>
          <li><code>mode</code> <code>llm</code> 为 AI 总结，<code>extract</code> 为摘录回退</li>
          <li><code>markdown</code> 固定两段：AI 焦点 / 其他资讯，约 28–32 条短结论</li>
          <li><code>itemCount</code> 精选条数</li>
          <li><code>feedsChecked</code> / <code>feedsOk</code> 检查与成功的订阅源数</li>
        </ul>
        <Code>{`curl -s https://news.airgzn.top/api/brief`}</Code>

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
      </div>
    </PageShell>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-md border border-zinc-200/80 bg-zinc-100/70 px-3 py-2.5 text-[13px] leading-6 text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
      <code>{children}</code>
    </pre>
  );
}
