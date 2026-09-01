# RSS News

深色极简的纯文字 RSS 信息流。打开页面先读服务器缓存，后台再刷新订阅源。

## 本地运行

```bash
npm install
npm run build
npm start
```

开发：

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 缓存

聚合结果会写入磁盘，默认 20 分钟刷新一次：

- 本地 / VPS：`.data/rss-cache.json`
- Vercel：`/tmp/rss-cache.json`
- 可用环境变量 `RSS_CACHE_PATH` 覆盖路径

有缓存时，打开网站会立刻出内容，不会每次都重新抓 100+ 个源。进程在跑时也会后台定时刷新。

英文标题会批量翻译成中文（每次请求最多 40 条、8 路并发），译文缓存在 `.data/rss-translations.json`。

手动刷新：

```bash
curl http://localhost:3000/api/refresh
```

如果设置了 `CRON_SECRET`：

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/refresh
```

VPS 可用 crontab，例如每 20 分钟：

```
*/20 * * * * curl -fsS http://127.0.0.1:3000/api/refresh >/dev/null
```

## 部署到 Vercel

1. 导入项目，Framework 选 Next.js
2. 可选环境变量：`OPML_URL`、`RSS_CACHE_PATH`、`CRON_SECRET`
3. 建议在 Vercel Cron 里每 20 分钟请求 `/api/refresh`

无状态 Serverless 上缓存不如 VPS 稳。长期跑请用 `next start` 放在自己的机器上。

## 订阅源

内置 OPML 约 98 条，再加主机/VPS 增补。分类收成五组：社区、AI、资讯、工程、主机。

首页「推荐」不是固定列表：点刷新或滑到尽头都会从今日内容里再抽一批，类似刷视频。
