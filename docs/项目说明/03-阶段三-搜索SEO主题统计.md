# 阶段三：搜索、SEO、暗色模式与访问统计

阶段 2 让访客能读文章。阶段 3 补上发现（搜索 / RSS / sitemap）、主题切换，以及只给后台用的访问统计写入。后台页面仍是占位，本阶段**没有**登录和 `/admin/stats` 界面。

打开 `npm run dev` 后，建议按「搜索有结果 → 无结果 → 切换主题并刷新 → 打开一篇正文 → curl feed/sitemap/robots」走一遍。

---

## 1. 和阶段二相比，多了什么

```
请求 /search?q=笔记
  → SearchPage                 app/(site)/search/page.tsx
       └─ searchPublishedPosts  lib/search.ts
            ├─ listPublishedPostContents()  只要已发布
            └─ Flexsearch + CJK n-gram

请求 /posts/first-notes
  → PostPage 成功渲染后
       └─ after(() => recordPostView(slug))  lib/stats.ts
            └─ 写入 data/stats.sqlite（管理员 session 则跳过）

请求 /feed.xml
  → Route Handler              app/feed.xml/route.ts
       └─ 最近 20 篇 HTML 全文
```

主题不走服务器：`next-themes` 在根布局注入一段阻塞脚本，按 `localStorage` 或系统偏好给 `<html>` 加上 `dark` / `light`，避免先闪浅色。

---

## 2. 目录地图（阶段三增量）

```
app/
├── layout.tsx                 ← ThemeProvider、标题模板、metadataBase、OG 默认
├── opengraph-image.tsx        ← 无封面时的默认分享图
├── sitemap.ts                 ← /sitemap.xml
├── robots.ts                  ← /robots.txt
├── feed.xml/route.ts          ← /feed.xml
└── (site)/search/page.tsx     ← 真正的搜索，不再是占位
components/
├── theme-provider.tsx
└── theme-toggle.tsx
lib/
├── search.ts                  ← Flexsearch + 中文切分
├── stats.ts                   ← SQLite PV
├── auth.ts                    ← 判断管理员 session（本阶段不写登录页）
└── feed.ts                    ← RSS XML
data/stats.sqlite              ← 运行后生成，已 gitignore
```

---

## 3. 搜索为什么能搜中文

Flexsearch 默认按空格分词。中文词之间没有空格，所以索引前先切成「单字 + 相邻二字」：

- 查询「笔记」→ `笔` `记` `笔记`
- 查询 `Markdown` → `markdown`（拉丁词整段保留）

只索引已发布文章的标题、摘要、正文；草稿 `unfinished-draft` 不会出现。结果页展示标题 + 摘要（复用 `PostCard`）。无结果时会写明搜的是哪句。

实现：`lib/search.ts` 的 `tokenizeForSearch`。

---

## 4. 暗色模式

- 默认：跟随系统（`defaultTheme="system"`）
- 导航里的「主题」：在浅色 / 深色之间切换，写入 `localStorage`，刷新保持
- CSS 变量已在 `app/globals.css` 的 `.dark` 里准备好；`html` 带 `suppressHydrationWarning`，字体变量放在 `body`，避免主题脚本改 `html.className` 时冲掉字体 class

---

## 5. SEO 与 RSS

| 地址 | 作用 |
|---|---|
| `/feed.xml` | 最近 20 篇已发布，`content:encoded` 为 HTML 全文 |
| `/sitemap.xml` | 静态页 + 已发布文章 + 标签页 |
| `/robots.txt` | 允许抓取公开页，禁止 `/admin` |
| 文档标题 | `{页面} · {SITE_NAME}`（根布局 `title.template`） |
| 文章分享 | `summary` 作描述；有封面用封面，否则用 `opengraph-image.tsx` |

`SITE_URL` 来自环境变量，用来拼绝对链接（`lib/site.ts` 的 `absoluteUrl`）。

---

## 6. 访问统计

访客**成功打开已发布正文**时，服务端用 Next.js 的 `after()` 记 1 次 PV，不挡住 HTML 响应。

- 草稿 / 未知 slug：404，不记
- 请求带有效管理员 session cookie（`admin_session`）不记
- 数据在 `data/stats.sqlite` 的 `post_views(slug, views)`
- 读取：`getTotalPageViews`、`listPublishedPostViews`、`getTopPublishedPostViews(10)`，给阶段 4 的 `/admin/stats` 用

本阶段没有统计页面。要确认写入，可打开一篇已发布正文后看 `data/stats.sqlite`。

登录仍未实现，所以本地开发时几乎每次打开正文都会 +1。阶段 4 会调用 `lib/auth.ts` 里的 `createAdminSessionToken` 种上同一颗 cookie。登录页与统计展示见 [04-阶段四-后台发文.md](./04-阶段四-后台发文.md)。

---

## 7. 建议自己试

1. `/search?q=笔记` 能命中精选那篇；`/search?q=不存在的词xyz` 有无结果说明；搜草稿正文里的句子不应出现。
2. 点导航「主题」，刷新后仍是你选的颜色。
3. 浏览器打开 `/posts/first-notes`，再看 `data/stats.sqlite` 是否有 `first-notes`。
4. 终端：`curl http://localhost:3000/feed.xml`、`/sitemap.xml`、`/robots.txt`。
