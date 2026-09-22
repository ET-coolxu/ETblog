---
title: 第一版实现 TODO
status: 进行中
created: 2026-08-27
updated: 2026-09-22
related:
  - docs/requirements/v1.md
---

# 第一版实现 TODO

按阶段从上到下做，不要跳步。产品行为以 [docs/requirements/v1.md](./requirements/v1.md) 为准。每阶段开始时 `@` 对应提示词，做完勾选本文件，并把该提示词 `status` 改为 `done` 后移入 `docs/agent-prompts/archive/`。

改需求：先改 PRD，再改提示词，再改本 TODO，最后改代码。

## 进度总览

| 阶段 | 状态 | 提示词 |
|---|---|---|
| 0 需求文档 | 已完成 | [PRD](./requirements/v1.md) |
| 1 工程骨架与部署配置 | 已完成 | [architecture](./agent-prompts/archive/2026-08-27-nextjs-personal-blog-v1.md) |
| 2 公开阅读 | 已完成 | [public-reading](./agent-prompts/archive/2026-08-27-public-reading.md) |
| 3 搜索 / SEO / 主题 / 统计写入 | 已完成 | [search-seo-stats](./agent-prompts/archive/2026-08-27-search-seo-stats.md) |
| 4 后台发文 | 已完成 | [admin-posts](./agent-prompts/archive/2026-08-27-admin-posts.md) |
| 5 上线前 | 进行中 | [go-live](./agent-prompts/archive/2026-09-11-go-live.md) |

---

## 阶段 0 · 需求文档

- [x] 撰写 [docs/requirements/v1.md](./requirements/v1.md)
- [x] 拆分 architecture / features 提示词
- [x] 回链 `AGENTS.md`、提示词 README、`project-conventions.mdc`

---

## 阶段 1 · 工程骨架与部署配置

提示词：`docs/agent-prompts/archive/2026-08-27-nextjs-personal-blog-v1.md`  
本阶段不实现阅读、搜索、后台。

- [x] 初始化 Next.js App Router + TypeScript + Tailwind，`output: 'standalone'`
- [x] 设计 token 与根布局壳（中文占位首页；站名来自 `SITE_NAME`）
- [x] 预留目录：`app/(site)/`、`app/admin/`、`content/posts/`、`content/pages/`、`public/uploads/`、`lib/`
- [x] `.env.example`：`SITE_NAME`、`AUTHOR_NAME`、`SITE_URL`、`ADMIN_PASSWORD`、`SESSION_SECRET`、可选 `ADMIN_USER`
- [x] `next.config`：standalone + 避免反向代理缓冲流式响应
- [x] `Dockerfile`、`docker-compose.yml`、`Caddyfile`；卷挂载 `content/`、`public/uploads/`、SQLite 目录
- [x] 根 README：本地 `next dev` 与 compose 启动说明
- [x] 验收：`next dev` 能打开占位首页；compose 能起或写明缺口

---

## 阶段 2 · 公开阅读

提示词：`docs/agent-prompts/archive/2026-08-27-public-reading.md`  
依赖阶段 1。搜索页可先放占位，不要做全文检索。

- [x] `lib/posts.ts`：读 `content/posts/{slug}.md`，解析 frontmatter，草稿对访客不可见，防路径穿越
- [x] `lib/markdown.ts`：GFM + Shiki + 标题锚点；不渲染原始 HTML / JSX
- [x] `/` 首页：配置简介、精选、最新已发布（最多 6 篇）
- [x] `/posts`：每页 10 篇、按日期降序、`?tag=` 筛选、空状态
- [x] `/posts/[slug]`：封面、阅读时间、目录（桌面高亮 / 移动折叠）、上一篇下一篇；草稿或未知 slug 对访客 404
- [x] `/tags`、`/tags/[tag]`
- [x] `/about`：渲染 `content/pages/about.md`；缺文件空状态、不 500
- [x] 全站导航与页脚（中文；站名/作者来自配置；搜索与 RSS 可为链接占位）
- [x] 至少 2 篇示例文章（含 1 篇 `featured`、1 篇 `draft`）和关于页
- [x] 浏览器走通：首页 → 列表 → 正文 → 标签 → 关于；草稿直链 404

---

## 阶段 3 · 搜索、SEO、暗色模式与统计写入

提示词：`docs/agent-prompts/archive/2026-08-27-search-seo-stats.md`  
依赖阶段 2。本阶段不做后台 UI。

- [x] `/search`：标题 + 摘要 + 正文；中文可用（CJK n-gram 或等价）；只返回已发布；无结果说明
- [x] 暗色模式：跟随系统、可切换、刷新保持、避免首屏闪浅色
- [x] `/feed.xml`：最近 20 篇已发布全文
- [x] `sitemap.xml`、`robots.txt`、文档标题 `{页面} · {SITE_NAME}`、文章 OG
- [x] `lib/stats.ts` + SQLite：访客打开已发布正文记 PV；有管理员 session 不记
- [x] 可读取总 PV、分文 PV、热门 Top 10（供阶段 4 展示）
- [x] 验收：搜索有/无结果、主题刷新、curl feed/sitemap/robots、确认 PV 有写入

---

## 阶段 4 · 后台发文

提示词：`docs/agent-prompts/archive/2026-08-27-admin-posts.md`  
依赖阶段 2；统计展示依赖阶段 3。

- [x] 登录 / 登出：`ADMIN_PASSWORD` + 可选 `ADMIN_USER` + httpOnly session
- [x] 未登录访问 `/admin/*`（除 login）重定向到登录页；错误密码笼统提示
- [x] `/admin` 文章列表（含草稿状态）；入口：写文章、统计
- [x] `/admin/posts/new`：创建时手填 slug，首次保存追加全站序号；分栏预览；保存草稿 / 发布
- [x] `/admin/posts/[slug]`：编辑；slug 只读；无关于页编辑
- [x] 图片上传：png/jpg/jpeg/webp/gif，≤5MB，禁 svg；写入 `public/uploads/{yyyy}/{mm}/`；正文插入 `![图片](...)`；封面可上传或填 https
- [x] 保存后 `revalidatePath`，前台不重建即可看到已发布变更
- [x] `/admin/stats`：需登录；总 PV、分文 PV、热门 Top 10
- [x] 浏览器走通：登录失败 → 成功 → 草稿对访客不可见 → 发布可见含图 → 再编辑前台更新

---

## 阶段 5 · 上线前（不阻塞开发）

提示词：[go-live](./agent-prompts/archive/2026-09-11-go-live.md)  
运维助手执行清单：[docs/vps-go-live.md](./vps-go-live.md)

已确认：`SITE_NAME=CoolXu's Blog`，`AUTHOR_NAME=coolxu`，`SITE_URL=https://coolxu.com`，域名 `coolxu.com`（尚未解析），证书邮箱 `maxxubuly@gmail.com`。首页简介与文章均不改。

- [x] 填写实际上线的 `SITE_NAME`、`AUTHOR_NAME`、`SITE_URL`
- [x] 仓库内上线清单与 README 入口已写好（DNS / Compose 仍待在 VPS 上执行）
- [ ] 域名 DNS 指向 VPS，Caddy 自动签发 HTTPS
- [ ] 全新 VPS 安装 Docker / Compose，数据卷持久化并跑通
- [x] 确认示例文章可以公开（本阶段不动文章）

---

## 增量 · 编辑器 slug / 封面 / 插图 alt

提示词：[editor-slug-cover](./agent-prompts/archive/2026-09-14-editor-slug-cover.md)

- [x] 新建首次保存写成 `{手填}-{下一序号}`；旧文不改名、编辑不重新编号
- [x] 封面选图上传 + `asCover` 放行 https（拒 `//`、`http://`、`javascript:`、`data:`）
- [x] 正文插图 alt 占位「图片」，磁盘命名不改

---

## 增量 · https 封面显示与编辑器预览

提示词：[https-cover-display](./agent-prompts/archive/2026-09-14-https-cover-display.md)

- [x] https 封面在列表/正文能显示（热链保护下不带跨站 Referer）
- [x] 后台封面合法路径或 https 时立刻预览；加载失败中文说明

---

## 增量 · 文章删除与存档

提示词：[post-delete-archive](./agent-prompts/archive/2026-09-15-post-delete-archive.md)

- [x] 已发布可存档；存档对访客 404，不进列表/搜索/RSS/sitemap
- [x] 存档不可直接发布，须先改为草稿再发布；已发布可改为草稿
- [x] 任意状态可删除：确认后删 Markdown 与该 slug 的 PV；不删 `public/uploads/`
- [x] 删除后不保留 slug 黑名单；新建仍按现存文件最大序号 + 1 分配
- [x] 后台列表标明草稿 / 已发布 / 已存档；状态变更后 `revalidatePath`

---

## 增量 · 首页与顶栏视觉刷新（A′）

提示词：[homepage-a-prime-visual-review](./agent-prompts/archive/2026-09-22-homepage-a-prime-visual-review.md)

- [x] 顶栏 C 式：品牌左，文章/标签/关于 + 搜索/主题右组；不粘滞、无头像
- [x] 首页去掉 intro hero；精选全宽封面 + 标题摘要，再纵向最新列表
- [x] 页脚仅作者 + RSS（已符合则保持）
- [x] 视觉复审：栏宽 720–800px、可见「精选」、400px 顶栏、最新封面克制

---

## 第一版明确不做

不要从本 TODO 里加上下列项：评论、邮件订阅、多用户、修改 slug、后台编辑关于页、独立 Umami/Postgres、CDN、文章内 JSX、正文原始 HTML、删除时的回收站、级联删除上传图片。
