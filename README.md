# RSS NEWS

小红书风格的 RSS 瀑布流新闻站：把技术社区、AI、科技媒体、大厂博客和主机/VPS 源聚合成无限滚动卡片流。

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。首次拉取全部订阅源大约需要几秒，之后会缓存 15 分钟。

```bash
npm run build
npm start
```

## 部署到 Vercel

1. 把仓库导入 [Vercel](https://vercel.com/new)
2. Framework Preset 选 Next.js，直接 Deploy
3. 可选环境变量：
   - `OPML_URL`：覆盖默认 OPML（默认 `https://raw.githubusercontent.com/JackyST0/awesome-rsshub-routes/main/feeds.opml`）

`/api/feed` 的 `maxDuration` 已设为 60 秒，避免首次聚合超时。

## 订阅源

内置 111 条源（OPML 98 条 + 主机/VPS 增补），分类：

- 技术社区、AI 专题、科技媒体、大厂技术博客
- 前端 & 设计、编程语言官方博客、技术周刊
- 安全资讯、开发工具版本追踪、RSS 工具更新
- 新闻/学术、主机/VPS（NodeLoc / LowEndTalk / Reddit 等）

部分站点会 403/429，页面会显示可用条数和失败源数量，不会整页空白。
