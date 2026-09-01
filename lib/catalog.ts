import { FeedSource } from './types';

export const CATEGORY_ORDER = [
  '技术社区',
  'AI 专题',
  '科技媒体',
  '大厂技术博客',
  '前端 & 设计',
  '编程语言官方博客',
  '技术周刊',
  '安全资讯',
  '开发工具版本追踪',
  'RSS 工具更新',
  '新闻/学术',
  '主机/VPS',
] as const;

export type CatalogCategory = (typeof CATEGORY_ORDER)[number];

export const FEED_CATALOG: FeedSource[] = [
  // 技术社区
  { title: 'LinuxDo 最新话题', url: 'https://linux.do/latest.rss', category: '技术社区' },
  { title: 'LinuxDo 热门话题', url: 'https://linux.do/top.rss', category: '技术社区' },
  { title: 'V2EX 最热', url: 'https://www.v2ex.com/feed/tab/hot.xml', category: '技术社区' },
  { title: 'V2EX 技术', url: 'https://www.v2ex.com/feed/tab/tech.xml', category: '技术社区' },
  { title: 'NodeSeek 最新话题', url: 'https://rss.nodeseek.com/', category: '技术社区' },
  { title: '奶昔论坛最新话题', url: 'https://forum.naixi.net/forum.php?mod=rss', category: '技术社区' },
  { title: 'Hacker News 首页', url: 'https://hnrss.org/frontpage', category: '技术社区' },
  { title: 'Hacker News 最佳', url: 'https://hnrss.org/best', category: '技术社区' },
  { title: 'Hacker News Ask', url: 'https://hnrss.org/ask', category: '技术社区' },
  { title: 'Hacker News Show', url: 'https://hnrss.org/show', category: '技术社区' },
  { title: '少数派', url: 'https://sspai.com/feed', category: '技术社区' },
  { title: '阮一峰的网络日志', url: 'https://www.ruanyifeng.com/blog/atom.xml', category: '技术社区' },

  // AI 专题
  { title: 'OpenAI 博客', url: 'https://openai.com/news/rss.xml', category: 'AI 专题' },
  { title: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', category: 'AI 专题' },
  { title: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', category: 'AI 专题' },
  { title: 'arXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI', category: 'AI 专题' },
  { title: 'arXiv 机器学习', url: 'https://rss.arxiv.org/rss/cs.LG', category: 'AI 专题' },
  { title: 'arXiv NLP', url: 'https://rss.arxiv.org/rss/cs.CL', category: 'AI 专题' },
  { title: 'arXiv 计算机视觉', url: 'https://rss.arxiv.org/rss/cs.CV', category: 'AI 专题' },
  { title: 'Hacker News AI', url: 'https://hnrss.org/newest?q=AI', category: 'AI 专题' },
  { title: 'Hacker News LLM', url: 'https://hnrss.org/newest?q=LLM', category: 'AI 专题' },
  { title: 'Hacker News OpenClaw', url: 'https://hnrss.org/newest?q=OpenClaw', category: 'AI 专题' },
  { title: 'Google Research Blog', url: 'https://research.google/blog/rss/', category: 'AI 专题' },
  { title: 'Hugging Face 博客', url: 'https://huggingface.co/blog/feed.xml', category: 'AI 专题' },
  { title: 'Stability AI', url: 'https://stability.ai/news?format=rss', category: 'AI 专题' },
  { title: 'OpenClaw Releases', url: 'https://github.com/openclaw/openclaw/releases.atom', category: 'AI 专题' },
  { title: 'OpenClaw Commits', url: 'https://github.com/openclaw/openclaw/commits/main.atom', category: 'AI 专题' },
  { title: '机器之心', url: 'https://www.jiqizhixin.com/rss', category: 'AI 专题' },
  { title: "Simon Willison's Blog", url: 'https://simonwillison.net/atom/everything/', category: 'AI 专题' },
  { title: 'OpenAI Codex Releases', url: 'https://github.com/openai/codex/releases.atom', category: 'AI 专题' },
  { title: 'Claude Code Releases', url: 'https://github.com/anthropics/claude-code/releases.atom', category: 'AI 专题' },
  { title: 'Gemini CLI Releases', url: 'https://github.com/google-gemini/gemini-cli/releases.atom', category: 'AI 专题' },
  { title: 'MCP Specification Releases', url: 'https://github.com/modelcontextprotocol/specification/releases.atom', category: 'AI 专题' },
  { title: 'MCP Servers Releases', url: 'https://github.com/modelcontextprotocol/servers/releases.atom', category: 'AI 专题' },

  // 科技媒体
  { title: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: '科技媒体' },
  { title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: '科技媒体' },
  { title: 'Wired', url: 'https://www.wired.com/feed/rss', category: '科技媒体' },
  { title: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: '科技媒体' },
  { title: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', category: '科技媒体' },

  // 大厂技术博客
  { title: 'GitHub Blog', url: 'https://github.blog/feed/', category: '大厂技术博客' },
  { title: 'GitHub Changelog', url: 'https://github.blog/changelog/feed/', category: '大厂技术博客' },
  { title: 'GitHub Copilot Changelog', url: 'https://github.blog/changelog/label/copilot/feed/', category: '大厂技术博客' },
  { title: 'Netflix Tech Blog', url: 'https://netflixtechblog.com/feed', category: '大厂技术博客' },
  { title: 'AWS Blog', url: 'https://aws.amazon.com/blogs/aws/feed/', category: '大厂技术博客' },
  { title: 'Cloudflare Blog', url: 'https://blog.cloudflare.com/rss/', category: '大厂技术博客' },
  { title: 'Google Developers', url: 'https://developers.googleblog.com/feeds/posts/default/', category: '大厂技术博客' },
  { title: 'Mozilla Hacks', url: 'https://hacks.mozilla.org/feed/', category: '大厂技术博客' },
  { title: 'Vercel Blog', url: 'https://vercel.com/atom', category: '大厂技术博客' },
  { title: 'Supabase Blog', url: 'https://supabase.com/rss.xml', category: '大厂技术博客' },
  { title: 'Stripe Blog', url: 'https://stripe.com/blog/feed.rss', category: '大厂技术博客' },
  { title: 'Spotify Engineering', url: 'https://engineering.atspotify.com/feed/', category: '大厂技术博客' },
  { title: 'Meta Engineering', url: 'https://engineering.fb.com/feed/', category: '大厂技术博客' },

  // 前端 & 设计
  { title: 'Smashing Magazine', url: 'https://www.smashingmagazine.com/feed/', category: '前端 & 设计' },
  { title: 'A List Apart', url: 'https://alistapart.com/main/feed/', category: '前端 & 设计' },
  { title: 'Codrops', url: 'https://tympanus.net/codrops/feed/', category: '前端 & 设计' },
  { title: 'CSS-Tricks', url: 'https://css-tricks.com/feed/', category: '前端 & 设计' },
  { title: 'Astro Blog', url: 'https://astro.build/rss.xml', category: '前端 & 设计' },
  { title: 'Svelte Blog', url: 'https://svelte.dev/blog/rss.xml', category: '前端 & 设计' },
  { title: 'Next.js Blog', url: 'https://nextjs.org/feed.xml', category: '前端 & 设计' },
  { title: 'Nuxt Blog', url: 'https://nuxt.com/blog/rss.xml', category: '前端 & 设计' },
  { title: 'Tailwind CSS Blog', url: 'https://tailwindcss.com/feeds/feed.xml', category: '前端 & 设计' },
  { title: 'Dev.to', url: 'https://dev.to/feed', category: '前端 & 设计' },
  { title: 'Chrome Developer Blog', url: 'https://developer.chrome.com/blog/feed.xml', category: '前端 & 设计' },
  { title: 'Dribbble Popular', url: 'https://dribbble.com/shots/popular.rss', category: '前端 & 设计' },
  { title: 'Product Hunt', url: 'https://www.producthunt.com/feed', category: '前端 & 设计' },

  // 编程语言官方博客
  { title: 'React Blog', url: 'https://react.dev/rss.xml', category: '编程语言官方博客' },
  { title: 'Vue Blog', url: 'https://blog.vuejs.org/feed.rss', category: '编程语言官方博客' },
  { title: 'Rust Blog', url: 'https://blog.rust-lang.org/feed.xml', category: '编程语言官方博客' },
  { title: 'Go Blog', url: 'https://go.dev/blog/feed.atom', category: '编程语言官方博客' },
  { title: 'Python Blog', url: 'https://blog.python.org/feeds/posts/default', category: '编程语言官方博客' },
  { title: 'Node.js Blog', url: 'https://nodejs.org/en/feed/blog.xml', category: '编程语言官方博客' },
  { title: 'Deno Blog', url: 'https://deno.com/blog/feed.xml', category: '编程语言官方博客' },
  { title: 'TypeScript Blog', url: 'https://devblogs.microsoft.com/typescript/feed/', category: '编程语言官方博客' },
  { title: 'Swift Blog', url: 'https://www.swift.org/atom.xml', category: '编程语言官方博客' },
  { title: 'Kotlin Blog', url: 'https://blog.jetbrains.com/kotlin/feed/', category: '编程语言官方博客' },

  // 技术周刊
  { title: 'JavaScript Weekly', url: 'https://javascriptweekly.com/rss/', category: '技术周刊' },
  { title: 'This Week in Rust', url: 'https://this-week-in-rust.org/atom.xml', category: '技术周刊' },
  { title: 'Golang Weekly', url: 'https://golangweekly.com/rss/', category: '技术周刊' },
  { title: 'ByteByteGo', url: 'https://blog.bytebytego.com/feed', category: '技术周刊' },

  // 安全资讯
  { title: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: '安全资讯' },
  { title: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', category: '安全资讯' },
  { title: 'Schneier on Security', url: 'https://www.schneier.com/feed/', category: '安全资讯' },
  { title: 'CISA News', url: 'https://www.cisa.gov/news.xml', category: '安全资讯' },
  { title: 'Google Security Blog', url: 'https://security.googleblog.com/atom.xml', category: '安全资讯' },
  { title: 'FreeBuf', url: 'https://www.freebuf.com/feed', category: '安全资讯' },
  { title: '安全客', url: 'https://api.anquanke.com/data/v1/rss', category: '安全资讯' },

  // 开发工具版本追踪
  { title: 'uv Releases', url: 'https://github.com/astral-sh/uv/releases.atom', category: '开发工具版本追踪' },
  { title: 'Zed Releases', url: 'https://github.com/zed-industries/zed/releases.atom', category: '开发工具版本追踪' },
  { title: 'Bun Releases', url: 'https://github.com/oven-sh/bun/releases.atom', category: '开发工具版本追踪' },
  { title: 'Biome Releases', url: 'https://github.com/biomejs/biome/releases.atom', category: '开发工具版本追踪' },
  { title: 'LangChain Releases', url: 'https://github.com/langchain-ai/langchain/releases.atom', category: '开发工具版本追踪' },

  // RSS 工具更新
  { title: 'RSSHub Releases', url: 'https://github.com/DIYgod/RSSHub/releases.atom', category: 'RSS 工具更新' },
  { title: 'RSSHub Radar Releases', url: 'https://github.com/DIYgod/RSSHub-Radar/releases.atom', category: 'RSS 工具更新' },
  { title: 'Fluent Reader Releases', url: 'https://github.com/yang991178/fluent-reader/releases.atom', category: 'RSS 工具更新' },
  { title: 'NetNewsWire Releases', url: 'https://github.com/Ranchero-Software/NetNewsWire/releases.atom', category: 'RSS 工具更新' },
  { title: 'FreshRSS Releases', url: 'https://github.com/FreshRSS/FreshRSS/releases.atom', category: 'RSS 工具更新' },

  // 新闻/学术
  { title: 'IT之家', url: 'https://www.ithome.com/rss/', category: '新闻/学术' },
  { title: 'Nature', url: 'https://www.nature.com/nature.rss', category: '新闻/学术' },

  // 主机/VPS
  { title: 'NodeLoc 最新', url: 'https://www.nodeloc.com/latest.rss', category: '主机/VPS' },
  { title: 'NodeLoc 热门', url: 'https://www.nodeloc.com/top.rss', category: '主机/VPS' },
  { title: 'LowEndTalk 讨论', url: 'https://lowendtalk.com/discussions/feed.rss', category: '主机/VPS' },
  { title: 'LowEndTalk Offers', url: 'https://lowendtalk.com/categories/offers/feed.rss', category: '主机/VPS' },
  { title: 'LowEndTalk Requests', url: 'https://lowendtalk.com/categories/requests/feed.rss', category: '主机/VPS' },
  { title: 'LowEndSpirit 讨论', url: 'https://lowendspirit.com/discussions/feed.rss', category: '主机/VPS' },
  { title: 'WebHostingTalk 全站', url: 'https://www.webhostingtalk.com/external.php?type=RSS2', category: '主机/VPS' },
  { title: 'WebHostingTalk VPS', url: 'https://www.webhostingtalk.com/external.php?type=RSS2&forumids=103', category: '主机/VPS' },
  { title: 'HostAdvice Blog', url: 'https://hostadvice.com/feed/', category: '主机/VPS' },
  { title: 'Reddit r/VPS', url: 'https://www.reddit.com/r/VPS/.rss', category: '主机/VPS' },
  { title: 'Reddit r/webhosting', url: 'https://www.reddit.com/r/webhosting/.rss', category: '主机/VPS' },
  { title: 'Reddit r/HomeNetworking', url: 'https://www.reddit.com/r/HomeNetworking/.rss', category: '主机/VPS' },
  { title: 'Reddit r/residentialproxies', url: 'https://www.reddit.com/r/residentialproxies/.rss', category: '主机/VPS' },
];

export function getCatalogCategories(): string[] {
  return ['全部', ...CATEGORY_ORDER];
}

export function mergeSources(extra: FeedSource[]): FeedSource[] {
  const byUrl = new Map<string, FeedSource>();
  for (const source of FEED_CATALOG) {
    byUrl.set(normalizeFeedUrl(source.url), source);
  }
  for (const source of extra) {
    const key = normalizeFeedUrl(source.url);
    if (!byUrl.has(key)) {
      byUrl.set(key, source);
    }
  }
  return Array.from(byUrl.values());
}

export function normalizeFeedUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}
