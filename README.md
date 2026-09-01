# Rnews

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

聚合结果会写入磁盘。每次把订阅源抓完就写一次（优先源先写一版，全部源完成再写一版）。默认 20 分钟后才会再抓：

- 本地 / VPS：`.data/rss-cache.json`，进程活着时每 20 分钟后台刷新
- Vercel：`/tmp/rss-cache.json`，实例回收后缓存和译文都会丢，下次请求再重建
- 可用环境变量 `RSS_CACHE_PATH` 覆盖路径

有缓存时，打开网站和点刷新都会立刻读缓存，不会卡住去重抓 100+ 个源。

英文标题只在后台抓源之后翻译：本地写入 `.data/rss-translations.json`，并回写进条目缓存。部署里还带一份 `data/translations.json` 种子，打开页面、点刷新、调用 API 都只读缓存，不会让用户请求去打翻译接口。纯中文或中英混杂的标题不会送去翻译。产品名、版本号等翻出来和原文一样的，也不显示第二行。

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

项目已带 `vercel.json`，可直接导入。

认领到自己的账号后，在 Vercel 项目 Settings → Cron Jobs 加上：

- Hobby：`0 4 * * *`（每天一次，UTC 4:00）访问 `/api/refresh`
- Pro：`*/20 * * * *`（每 20 分钟）

**方式一：Git 导入（推荐，长期用）**

1. 把代码放到 GitHub / GitLab
2. 打开 [vercel.com/new](https://vercel.com/new)，导入该仓库，Framework 选 Next.js
3. 可选环境变量：`OPML_URL`、`CRON_SECRET`
4. Pro 计划可以把 cron 改成 `*/20 * * * *`，缓存会更及时

**方式二：命令行**

```bash
npx vercel login
npx vercel --prod
```

无状态 Serverless 上 `/tmp` 缓存会随实例回收。第一次打开会现场拉源，之后同一实例会复用缓存。长期更稳的做法是用 `next start` 放在自己的机器上。

## 订阅源

内置 OPML 约 98 条，再加主机/VPS 增补。分类收成五组：社区、AI、资讯、工程、主机。

首页「推荐」不是固定列表：点刷新或滑到尽头都会从今日内容里再抽一批，类似刷视频。

## 公开 API

文档页：`/docs`

- `GET /api/v1/feed` JSON 聚合，可用 `since` 增量拉取
- `GET /api/v1/rss` RSS 2.0，条目带一句摘要
- `GET /api/v1/categories` 分类
- 公开接口每个 IP 每分钟 60 次；超限返回 429
