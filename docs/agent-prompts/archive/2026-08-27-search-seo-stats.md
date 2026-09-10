---
title: 搜索、SEO、暗色模式与访问统计
type: feature
status: done
created: 2026-08-27
updated: 2026-09-10
related:
  - docs/requirements/v1.md
  - docs/agent-prompts/archive/2026-08-27-public-reading.md
---

# 搜索、SEO、暗色模式与访问统计

请按本提示词实现，不要扩大范围。实现前先读 `.cursor/rules/project-conventions.mdc`、`docs/requirements/v1.md` 与相关现有代码。产品细节以 PRD 为准。本切片依赖公开阅读已可用。

## 背景

阅读页就绪后，仍缺发现（搜索/RSS/sitemap）、主题切换和仅管理员可见的访问统计。

## 目标

- `/search`：搜已发布文章的标题、摘要、正文；中文关键词可用；结果为标题 + 摘要片段；无结果有说明。
- 暗色模式：默认跟随系统，可手动切换，刷新保持，避免首屏闪浅色。
- `/feed.xml`：最近 20 篇已发布全文；`sitemap.xml`、`robots.txt`；标题 `{页面} · {SITE_NAME}`；文章 OG（有封面用封面，否则默认图）。
- 访客成功打开已发布正文时服务端记 PV；若已有管理员 session 则不记。SQLite 存储。提供 `lib/stats.ts` 供后台读取总 PV、分文 PV、热门 Top 10。`/admin/stats` 页面留给后台切片，本切片不要做后台 UI。

## 非目标

- 管理后台 UI（含 `/admin/stats` 页面）、写文章、图片上传、登录实现。
- 独立 Umami/Postgres、评论、订阅。
- 改公开阅读的内容模型字段。

## 约束

- 遵守 Markdown 唯一信源、中文文案、第一版不做评论/订阅/多用户。
- 搜索必须用 CJK n-gram 或等价方案，不能只按空格分词。
- 草稿不进搜索、RSS、sitemap，不计 PV。
- 统计不对访客展示。
- 配置项仍走环境变量：`SITE_NAME`、`SITE_URL` 等。

## 验收标准

- [x] 中文关键词能搜到标题、摘要或正文；只返回已发布；无结果有说明
- [x] 浅色/深色可切换，默认跟随系统，刷新保持
- [x] `/feed.xml` 最近 20 篇已发布全文；有 sitemap、robots、OG、标题格式正确
- [x] 访客打开已发布正文记 PV；若请求带管理员 session 则不记
- [x] 统计写入 SQLite；`lib/stats.ts` 能读出总 PV、分文 PV、热门 Top 10

## 涉及范围

- 文件/模块：`app/(site)/search`、`app/feed.xml`、`app/sitemap.ts`、`app/robots.ts`、OG 相关、`lib/search.ts`、`lib/stats.ts`、主题切换、SQLite 文件位置
- 不影响：文章 CRUD、图片上传、Markdown 管线大改

## 实现要点

- 搜索：服务端 Flexsearch 0.7 Document；索引前把标题/摘要/正文做成 CJK 单字 + bigram（外加拉丁词），查询同样处理。
- 统计：`better-sqlite3`，文件 `data/stats.sqlite`；正文页用 `after()` 写入。管理员判断走 `lib/auth.ts` 的 httpOnly HMAC cookie（本切片不做登录页）。
- 暗色：`next-themes`，`attribute="class"`，默认 `system`，layout 内 ThemeProvider 防闪。
- RSS：`/feed.xml` 输出最近 20 篇已发布的 **HTML 全文**（remark-gfm → HTML，不跑 Shiki）。

## 验证

- 浏览器：搜索有结果与无结果；切换主题并刷新；打开一篇已发布正文。
- 无法用浏览器验证的部分：curl 检查 `/feed.xml`、`/sitemap.xml`、`/robots.txt`；用 sqlite 或临时日志确认 PV 有写入（`/admin/stats` 在后台切片验收）。
