import { FeedSource } from './types';

export const CATEGORY_ORDER = ['社区', 'AI', '资讯', '工程', '主机'] as const;

export type CatalogCategory = (typeof CATEGORY_ORDER)[number];

const CATEGORY_ALIASES: Record<string, CatalogCategory> = {
  技术社区: '社区',
  社区: '社区',
  'AI 专题': 'AI',
  AI: 'AI',
  科技媒体: '资讯',
  '新闻/学术': '资讯',
  安全资讯: '资讯',
  资讯: '资讯',
  大厂技术博客: '工程',
  '前端 & 设计': '工程',
  编程语言官方博客: '工程',
  技术周刊: '工程',
  开发工具版本追踪: '工程',
  'RSS 工具更新': '工程',
  工程: '工程',
  '主机/VPS': '主机',
  主机: '主机',
  'VPS/Hosting': '主机',
};

export function normalizeCategory(raw?: string): CatalogCategory {
  const value = (raw || '').replace(/^[\s\p{Emoji_Presentation}\p{Extended_Pictographic}]+/u, '').trim();
  if (value in CATEGORY_ALIASES) return CATEGORY_ALIASES[value];
  if (/AI|人工智能|LLM|机器学习/.test(value)) return 'AI';
  if (/社区|论坛|Hacker News|V2EX|LinuxDo|NodeSeek/.test(value)) return '社区';
  if (/VPS|主机|Hosting|NodeLoc|LowEnd/i.test(value)) return '主机';
  if (/安全|Security|新闻|学术|媒体|资讯/.test(value)) return '资讯';
  return '工程';
}

export const FEED_CATALOG: FeedSource[] = [
  // 技术社区
  { title: 'LinuxDo 最新话题', url: 'https://linux.do/latest.rss', category: '社区' },
  { title: 'LinuxDo 热门话题', url: 'https://linux.do/top.rss', category: '社区' },
  { title: 'V2EX 最热', url: 'https://www.v2ex.com/feed/tab/hot.xml', category: '社区' },
  { title: 'V2EX 技术', url: 'https://www.v2ex.com/feed/tab/tech.xml', category: '社区' },
  { title: 'NodeSeek 最新话题', url: 'https://rss.nodeseek.com/', category: '社区' },
  { title: '奶昔论坛最新话题', url: 'https://forum.naixi.net/forum.php?mod=rss', category: '社区' },
  { title: 'Hacker News 首页', url: 'https://hnrss.org/frontpage', category: '社区' },
  { title: 'Hacker News 最佳', url: 'https://hnrss.org/best', category: '社区' },
  { title: 'Hacker News Ask', url: 'https://hnrss.org/ask', category: '社区' },
  { title: 'Hacker News Show', url: 'https://hnrss.org/show', category: '社区' },
  { title: '少数派', url: 'https://sspai.com/feed', category: '社区' },
  { title: '阮一峰的网络日志', url: 'https://www.ruanyifeng.com/blog/atom.xml', category: '社区' },

  // AI 专题
  { title: 'OpenAI 博客', url: 'https://openai.com/news/rss.xml', category: 'AI' },
  { title: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', category: 'AI' },
  { title: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', category: 'AI' },
  { title: 'arXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI', category: 'AI' },
  { title: 'arXiv 机器学习', url: 'https://rss.arxiv.org/rss/cs.LG', category: 'AI' },
  { title: 'arXiv NLP', url: 'https://rss.arxiv.org/rss/cs.CL', category: 'AI' },
  { title: 'arXiv 计算机视觉', url: 'https://rss.arxiv.org/rss/cs.CV', category: 'AI' },
  { title: 'Hacker News AI', url: 'https://hnrss.org/newest?q=AI', category: 'AI' },
  { title: 'Hacker News LLM', url: 'https://hnrss.org/newest?q=LLM', category: 'AI' },
  { title: 'Hacker News OpenClaw', url: 'https://hnrss.org/newest?q=OpenClaw', category: 'AI' },
  { title: 'Google Research Blog', url: 'https://research.google/blog/rss/', category: 'AI' },
  { title: 'Hugging Face 博客', url: 'https://huggingface.co/blog/feed.xml', category: 'AI' },
  { title: 'Stability AI', url: 'https://stability.ai/news?format=rss', category: 'AI' },
  { title: 'OpenClaw Releases', url: 'https://github.com/openclaw/openclaw/releases.atom', category: 'AI' },
  { title: 'OpenClaw Commits', url: 'https://github.com/openclaw/openclaw/commits/main.atom', category: 'AI' },
  { title: '机器之心', url: 'https://www.jiqizhixin.com/rss', category: 'AI' },
  { title: "Simon Willison's Blog", url: 'https://simonwillison.net/atom/everything/', category: 'AI' },
  { title: 'OpenAI Codex Releases', url: 'https://github.com/openai/codex/releases.atom', category: 'AI' },
  { title: 'Claude Code Releases', url: 'https://github.com/anthropics/claude-code/releases.atom', category: 'AI' },
  { title: 'Gemini CLI Releases', url: 'https://github.com/google-gemini/gemini-cli/releases.atom', category: 'AI' },
  { title: 'MCP Specification Releases', url: 'https://github.com/modelcontextprotocol/specification/releases.atom', category: 'AI' },
  { title: 'MCP Servers Releases', url: 'https://github.com/modelcontextprotocol/servers/releases.atom', category: 'AI' },

  // 科技媒体
  { title: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: '资讯' },
  { title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: '资讯' },
  { title: 'Wired', url: 'https://www.wired.com/feed/rss', category: '资讯' },
  { title: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: '资讯' },
  { title: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', category: '资讯' },

  // 大厂技术博客
  { title: 'GitHub Blog', url: 'https://github.blog/feed/', category: '工程' },
  { title: 'GitHub Changelog', url: 'https://github.blog/changelog/feed/', category: '工程' },
  { title: 'GitHub Copilot Changelog', url: 'https://github.blog/changelog/label/copilot/feed/', category: '工程' },
  { title: 'Netflix Tech Blog', url: 'https://netflixtechblog.com/feed', category: '工程' },
  { title: 'AWS Blog', url: 'https://aws.amazon.com/blogs/aws/feed/', category: '工程' },
  { title: 'Cloudflare Blog', url: 'https://blog.cloudflare.com/rss/', category: '工程' },
  { title: 'Google Developers', url: 'https://developers.googleblog.com/feeds/posts/default/', category: '工程' },
  { title: 'Mozilla Hacks', url: 'https://hacks.mozilla.org/feed/', category: '工程' },
  { title: 'Vercel Blog', url: 'https://vercel.com/atom', category: '工程' },
  { title: 'Supabase Blog', url: 'https://supabase.com/rss.xml', category: '工程' },
  { title: 'Stripe Blog', url: 'https://stripe.com/blog/feed.rss', category: '工程' },
  { title: 'Spotify Engineering', url: 'https://engineering.atspotify.com/feed/', category: '工程' },
  { title: 'Meta Engineering', url: 'https://engineering.fb.com/feed/', category: '工程' },

  // 前端 & 设计
  { title: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: '工程' },
  { title: 'A List Apart', url: 'https://alistapart.com/main/feed/', category: '工程' },
  { title: 'Codrops', url: 'https://tympanus.net/codrops/feed/', category: '工程' },
  { title: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: '工程' },
  { title: 'Astro Blog', url: 'https://astro.build/rss.xml', category: '工程' },
  { title: 'Svelte Blog', url: 'https://svelte.dev/blog/rss.xml', category: '工程' },
  { title: 'Next.js Blog', url: 'https://nextjs.org/feed.xml', category: '工程' },
  { title: 'Nuxt Blog', url: 'https://nuxt.com/blog/rss.xml', category: '工程' },
  { title: 'Tailwind CSS Blog', url: 'https://tailwindcss.com/feeds/feed.xml', category: '工程' },
  { title: 'Dev.to', url: 'https://dev.to/feed', category: '工程' },
  { title: 'Chrome Developer Blog', url: 'https://developer.chrome.com/blog/feed.xml', category: '工程' },
  { title: 'Dribbble Popular', url: 'https://dribbble.com/shots/popular.rss', category: '工程' },
  { title: 'Product Hunt', url: 'https://www.producthunt.com/feed', category: '工程' },

  // 编程语言官方博客
  { title: 'React Blog', url: 'https://react.dev/rss.xml', category: '工程' },
  { title: 'Vue Blog', url: 'https://blog.vuejs.org/feed.rss', category: '工程' },
  { title: 'Rust Blog', url: 'https://blog.rust-lang.org/feed.xml', category: '工程' },
  { title: 'Go Blog', url: 'https://go.dev/blog/feed.atom', category: '工程' },
  { title: 'Python Blog', url: 'https://blog.python.org/feeds/posts/default', category: '工程' },
  { title: 'Node.js Blog', url: 'https://nodejs.org/en/feed/blog.xml', category: '工程' },
  { title: 'Deno Blog', url: 'https://deno.com/blog/feed.xml', category: '工程' },
  { title: 'TypeScript Blog', url: 'https://devblogs.microsoft.com/typescript/feed/', category: '工程' },
  { title: 'Swift Blog', url: 'https://www.swift.org/atom.xml', category: '工程' },
  { title: 'Kotlin Blog', url: 'https://blog.jetbrains.com/kotlin/feed/', category: '工程' },

  // 技术周刊
  { title: 'JavaScript Weekly', url: 'https://javascriptweekly.com/rss/', category: '工程' },
  { title: 'This Week in Rust', url: 'https://this-week-in-rust.org/atom.xml', category: '工程' },
  { title: 'Golang Weekly', url: 'https://golangweekly.com/rss/', category: '工程' },
  { title: 'ByteByteGo', url: 'https://blog.bytebytego.com/feed', category: '工程' },

  // 安全资讯
  { title: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: '资讯' },
  { title: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', category: '资讯' },
  { title: 'Schneier on Security', url: 'https://www.schneier.com/feed/', category: '资讯' },
  { title: 'CISA News', url: 'https://www.cisa.gov/news.xml', category: '资讯' },
  { title: 'Google Security Blog', url: 'https://security.googleblog.com/atom.xml', category: '资讯' },
  { title: 'FreeBuf', url: 'https://www.freebuf.com/feed', category: '资讯' },
  { title: '安全客', url: 'https://api.anquanke.com/data/v1/rss', category: '资讯' },

  // 开发工具版本追踪
  { title: 'uv Releases', url: 'https://github.com/astral-sh/uv/releases.atom', category: '工程' },
  { title: 'Zed Releases', url: 'https://github.com/zed-industries/zed/releases.atom', category: '工程' },
  { title: 'Bun Releases', url: 'https://github.com/oven-sh/bun/releases.atom', category: '工程' },
  { title: 'Biome Releases', url: 'https://github.com/biomejs/biome/releases.atom', category: '工程' },
  { title: 'LangChain Releases', url: 'https://github.com/langchain-ai/langchain/releases.atom', category: '工程' },

  // RSS 工具更新
  { title: 'RSSHub Releases', url: 'https://github.com/DIYgod/RSSHub/releases.atom', category: '工程' },
  { title: 'RSSHub Radar Releases', url: 'https://github.com/DIYgod/RSSHub-Radar/releases.atom', category: '工程' },
  { title: 'Fluent Reader Releases', url: 'https://github.com/yang991178/fluent-reader/releases.atom', category: '工程' },
  { title: 'NetNewsWire Releases', url: 'https://github.com/Ranchero-Software/NetNewsWire/releases.atom', category: '工程' },
  { title: 'FreshRSS Releases', url: 'https://github.com/FreshRSS/FreshRSS/releases.atom', category: '工程' },

  // 新闻/学术
  { title: 'IT之家', url: 'https://www.ithome.com/rss/', category: '资讯' },
  { title: 'Nature', url: 'https://www.nature.com/nature.rss', category: '资讯' },

  // 主机/VPS
  { title: 'NodeLoc 最新', url: 'https://www.nodeloc.com/latest.rss', category: '主机' },
  { title: 'NodeLoc 热门', url: 'https://www.nodeloc.com/top.rss', category: '主机' },
  { title: 'LowEndTalk 讨论', url: 'https://lowendtalk.com/discussions/feed.rss', category: '主机' },
  { title: 'LowEndTalk Offers', url: 'https://lowendtalk.com/categories/offers/feed.rss', category: '主机' },
  { title: 'LowEndTalk Requests', url: 'https://lowendtalk.com/categories/requests/feed.rss', category: '主机' },
  { title: 'LowEndSpirit 讨论', url: 'https://lowendspirit.com/discussions/feed.rss', category: '主机' },
  { title: 'WebHostingTalk 全站', url: 'https://www.webhostingtalk.com/external.php?type=RSS2', category: '主机' },
  { title: 'WebHostingTalk VPS', url: 'https://www.webhostingtalk.com/external.php?type=RSS2&forumids=103', category: '主机' },
  { title: 'HostAdvice Blog', url: 'https://hostadvice.com/feed/', category: '主机' },
  { title: 'Reddit r/VPS', url: 'https://www.reddit.com/r/VPS/.rss', category: '主机' },
  { title: 'Reddit r/webhosting', url: 'https://www.reddit.com/r/webhosting/.rss', category: '主机' },
  { title: 'Reddit r/HomeNetworking', url: 'https://www.reddit.com/r/HomeNetworking/.rss', category: '主机' },
  { title: 'Reddit r/residentialproxies', url: 'https://www.reddit.com/r/residentialproxies/.rss', category: '主机' },
];

export function getCatalogCategories(): string[] {
  return ['全部', ...CATEGORY_ORDER];
}

export function mergeSources(extra: FeedSource[]): FeedSource[] {
  const byUrl = new Map<string, FeedSource>();
  for (const source of FEED_CATALOG) {
    byUrl.set(normalizeFeedUrl(source.url), {
      ...source,
      category: normalizeCategory(source.category),
    });
  }
  for (const source of extra) {
    const key = normalizeFeedUrl(source.url);
    if (!byUrl.has(key)) {
      byUrl.set(key, {
        ...source,
        category: normalizeCategory(source.category),
      });
    }
  }
  return Array.from(byUrl.values());
}

export function normalizeFeedUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}
