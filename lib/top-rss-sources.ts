import type { FeedSource } from './types';

// Curated technical and technology feeds from:
// https://github.com/weekend-project-space/top-rss-list
// The upstream list also contains lifestyle, entertainment, inactive HTTP
// endpoints, and duplicate mirrors; those are intentionally not imported.
export const TOP_RSS_SOURCES: FeedSource[] = [
  { title: 'V2EX 全站', url: 'https://v2ex.com/index.xml', category: '社区' },
  { title: '胡涂说', url: 'https://hutusi.com/feed.xml', category: '社区' },
  { title: "oldj's blog", url: 'https://oldj.net/feed', category: '社区' },
  { title: "Randy's Blog", url: 'https://lutaonan.com/rss.xml', category: '社区' },
  { title: '晚晴幽草轩', url: 'https://www.jeffjade.com/atom.xml', category: '社区' },
  { title: '月光博客', url: 'https://www.williamlong.info/rss.xml', category: '社区' },
  { title: '卡瓦邦噶', url: 'https://www.kawabangga.com/feed', category: '社区' },
  { title: '离别歌', url: 'https://www.leavesongs.com/feed/', category: '社区' },
  { title: '潮流周刊', url: 'https://weekly.tw93.fun/rss.xml', category: '社区' },
  { title: '爱范儿', url: 'https://www.ifanr.com/feed', category: '资讯' },
  { title: '奇客 Solidot', url: 'https://www.solidot.org/index.rss', category: '资讯' },
  { title: '小众软件', url: 'https://www.appinn.com/feed/', category: '资讯' },
  { title: '极客公园', url: 'https://www.geekpark.net/rss', category: '资讯' },
  { title: '机核', url: 'https://www.gcores.com/rss', category: '资讯' },
  { title: 'MIT 科技评论中国热榜', url: 'https://plink.anyfeeder.com/mittrchina/hot', category: '资讯' },
  { title: '微软研究院 AI 头条', url: 'https://plink.anyfeeder.com/weixin/MSRAsia', category: 'AI' },
  { title: '新智元', url: 'https://plink.anyfeeder.com/weixin/AI_era', category: 'AI' },
  { title: '美团技术团队', url: 'https://tech.meituan.com/feed/', category: '工程' },
  { title: '有赞技术团队', url: 'https://tech.youzan.com/rss/', category: '工程' },
  { title: 'Julia Evans', url: 'https://jvns.ca/atom.xml', category: '工程' },
  { title: "Xuanwo's Blog", url: 'https://xuanwo.io/index.xml', category: '工程' },
  { title: '张鑫旭', url: 'https://www.zhangxinxu.com/wordpress/feed/', category: '工程' },
  { title: '云风的 BLOG', url: 'https://blog.codingnow.com/atom.xml', category: '工程' },
  { title: 'bboysoul 的博客', url: 'https://www.bboy.app/atom.xml', category: '工程' },
];
