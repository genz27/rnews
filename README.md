# Rnews

深色极简的纯文字 RSS 信息流。页面只读取预生成快照，抓源和翻译都在后台完成。

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

聚合结果会写入磁盘。每次把订阅源抓完就写一次（优先源先写一版，全部源完成再写一版）：

- 本地 / VPS：`.data/rss-cache.json`，进程活着时每 20 分钟后台刷新
- Vercel：直接读取仓库里的 `data/rss-cache.json` 和 `data/translations.json`
- GitHub Actions：每小时第 7、37 分钟刷新快照，提交后触发 Vercel 自动部署
- 可用环境变量 `RSS_CACHE_PATH` 覆盖路径

打开网站、点刷新和调用 API 都只读快照，不会在用户请求里抓 100+ 个源或调用翻译服务。

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

项目已带 `vercel.json` 和 `.github/workflows/refresh-cache.yml`。GitHub Actions 负责持久快照，不需要配置 Vercel Cron。

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

无状态 Serverless 实例只读取随部署发布的快照，因此冷启动也不会现场抓源。浏览器还会用 Cache Storage 保存最近一版分类数据。

## 订阅源

内置 OPML 约 98 条，再加主机/VPS 增补。分类收成五组：社区、AI、资讯、工程、主机。

首页「推荐」不是固定列表：点刷新或滑到尽头都会从今日内容里再抽一批，类似刷视频。

## 公开 API

文档页：`/docs`

- `GET /api/v1/feed` JSON 聚合，可用 `since` 增量拉取
- `GET /api/v1/rss` RSS 2.0，条目带一句摘要
- `GET /api/v1/categories` 分类
- 公开接口每个 IP 每分钟 60 次；超限返回 429
