---
name: Next.js 个人博客规划
overview: 先把第一版产品需求写成仓库文档（PRD + 可执行提示词），确认无歧义后再按文档实现 Next.js 自托管博客。代码实现暂不开始。
todos:
  - id: write-prd
    content: 落盘 docs/requirements/v1.md（完整产品需求，含用户故事、页面、字段、规则、验收）
    status: completed
  - id: split-prompts
    content: 按 PRD 拆 features 提示词，并回链更新 architecture 提示词与 README
    status: completed
  - id: scaffold
    content: 初始化 Next.js + TypeScript + Tailwind，搭公开布局与设计 token
    status: pending
  - id: md-pipeline
    content: 实现 content/posts Markdown 渲染（frontmatter、Shiki、TOC、图片路径）与列表/详情/标签页
    status: pending
  - id: standard-features
    content: 加全文搜索、暗色模式、RSS/sitemap/OG、SQLite 访问统计
    status: pending
  - id: admin
    content: 管理后台：登录、文章新建/编辑/草稿/发布、图片上传、发布后 revalidate（不删文、不改 slug、不编关于页）
    status: pending
  - id: deploy
    content: standalone Docker + Caddy HTTPS，持久化 content/uploads/sqlite 卷
    status: pending
isProject: false
---

# Next.js 个人博客规划（需求先行）

在写任何应用代码之前，先把需求落盘。现有 [architecture 提示词](docs/agent-prompts/architecture/2026-08-27-nextjs-personal-blog-v1.md) 只覆盖技术选型，不足以当产品需求。

确认本规划后，**第一批交付是文档，不是代码**：

- [docs/requirements/v1.md](docs/requirements/v1.md)：人读的完整 PRD（唯一产品说明）
- 若干 `docs/agent-prompts/features/YYYY-MM-DD-*.md`：按切片可发给 AI 实现
- 回链更新 architecture 提示词的 `related`、[docs/agent-prompts/README.md](docs/agent-prompts/README.md)

下面是将写入 PRD 的内容草案。实现阶段必须按落盘后的文件执行，不另起一套需求。

## 已确认决策

- 文章以 Markdown 文件为唯一信源；后台只是文件编辑器。
- 第一版范围：公开阅读 + 搜索 + 代码高亮 + 目录 + 暗色模式 + 访问统计 + 后台发文（含图片）。
- 站名、作者署名：占位符 `SITE_NAME` / `AUTHOR_NAME`，上线前再改（配置或环境变量，不要写死在组件里）。
- 后台第一版：**只管文章**（新建、编辑、草稿、发布）+ 图片上传。不删除文章、创建后不可改 slug、关于页只用本地 `content/pages/about.md`。
- 不做：评论、邮件订阅、多用户、独立 Umami/Postgres、CDN。

## 角色

- **访客**：读已发布文章、按标签浏览、搜索、订阅 RSS。不登录。
- **管理员**：密码登录后写文章、改草稿、上传图片、看访问统计。仅一人。

## 用户故事

- 访客打开首页，能看到站点简介和最新已发布文章，点进正文阅读。
- 访客在列表/标签页浏览已发布文章；草稿不可见。
- 访客在正文看到目录、代码高亮、封面（若有）、上一篇/下一篇。
- 访客用中文关键词搜索标题、摘要、正文，得到已发布结果。
- 访客切换浅色/深色（默认跟随系统），刷新后保持。
- 访客通过 RSS、sitemap 发现文章；分享链接有合理标题、描述和 OG 图。
- 管理员登录后台，新建文章（此时设定 slug），写 Markdown，上传图片并插入正文，存草稿或发布。
- 管理员再次打开已有文章继续改，发布后前台立刻可见（`revalidatePath`，不整站重建）。
- 管理员在统计页看到各文 PV 和热门文章。
- 管理员不能删除文章、不能改已有 slug、不能在后台改关于页。

## 内容模型

文章文件：`content/posts/{slug}.md`

Frontmatter：

- `title`（必填，字符串）
- `date`（必填，ISO 日期 `YYYY-MM-DD`）
- `tags`（字符串数组，可空）
- `summary`（字符串，列表/RSS/SEO 用；空则截取正文前约 120 字）
- `cover`（可选，站点内路径如 `/uploads/2026/08/x.webp`）
- `draft`（布尔，默认 `false`；`true` 则不出现在公开列表、详情直链对访客 404、搜索、RSS、sitemap、统计不计）
- `featured`（布尔，默认 `false`；首页优先展示）

规则：

- `slug` 仅 `[a-z0-9-]+`，创建时确定，之后不可改；文件名与 slug 一致。
- 标签展示用原文；URL 用编码后的标签名。
- 正文为 Markdown + GFM（表格、任务列表、删除线、自动链接）。**不允许**正文里写 JSX/React 组件，也**不开启**原始 HTML。
- 图片：`public/uploads/{yyyy}/{mm}/`，正文 `![说明](/uploads/...)`。
- 关于页：`content/pages/about.md`，仅本地编辑；缺文件时关于页显示明确空状态（不要 500）。

## 公开页面

- `/`：导航、简介（来自站点配置占位文案，不是关于页全文）、精选（`featured`）、最新已发布（最多 6 篇）。无精选则只显示最新。
- `/posts`：已发布列表，每页 10 篇，按 `date` 降序；支持 `?tag=` 筛选。空列表有空状态。
- `/posts/[slug]`：标题、日期、标签、封面、估算阅读时间（中文约 300 字/分钟）、正文、h2/h3 目录（桌面随滚动高亮，移动端折叠）、上一篇/下一篇（已发布、按日期）。未知 slug 或草稿：访客 404。
- `/tags`：标签及文章数（仅统计已发布）。
- `/tags/[tag]`：该标签下已发布列表。
- `/about`：渲染关于页 Markdown。
- `/search`：输入即查（提交或短防抖均可），结果为标题 + 摘要片段；无结果有说明。必须能搜中文（用 CJK n-gram 或等价方案，不能只按空格分词）。
- `/feed.xml`：最近 20 篇已发布，**全文**。
- `sitemap.xml`、`robots.txt`、文章 OG。标题格式：`{页面} · {SITE_NAME}`。

导航：站名、文章、标签、关于、搜索、主题切换。页脚：作者占位、RSS 链接。

## 后台页面（需登录）

- `/admin/login`：密码登录（`ADMIN_PASSWORD`）。可选 `ADMIN_USER`，默认 `admin`。错误密码有提示，不泄露是否用户存在。
- `/admin`：全部文章含草稿，标记草稿/已发布；入口「写文章」、统计。
- `/admin/posts/new`：填写 slug（仅此一次）及 frontmatter + 正文；分栏预览；拖拽/粘贴上传图片并插入 Markdown。操作：保存草稿、发布。
- `/admin/posts/[slug]`：编辑已有文章。slug 只读。无删除按钮。
- `/admin/stats`：总 PV、每篇文章 PV、热门 Top 10（已发布）。
- `/admin/logout`

鉴权：环境变量密码 + httpOnly session（如 iron-session）。未登录访问 `/admin/*`（除 login）重定向到登录页。上传接口必须鉴权。

图片：png / jpg / jpeg / webp / gif，单文件最大 5MB，禁止 svg。失败时后台显示原因。

## 统计

- 访客成功打开已发布正文时记 1 次 PV（服务端）。带管理员 session 的请求不记。
- 存在应用内 SQLite，不做独立分析产品。
- 统计不向访客展示。

## 非功能

- 界面文案全程中文。
- 阅读优先：克制衬线标题、清晰正文、充足行宽；暗色模式一等公民。签名元素：正文左侧随滚动高亮的目录，而非大 Hero。
- 配置：`SITE_NAME`、`AUTHOR_NAME`、`SITE_URL`、`ADMIN_PASSWORD`、`SESSION_SECRET`。
- 安全：slug 防路径穿越；Markdown 不渲染原始 HTML；管理员路由与上传均需登录。
- 部署：`output: 'standalone'` + Docker Compose + Caddy HTTPS；卷持久化 `content/`、`public/uploads/`、SQLite 目录。`X-Accel-Buffering: no`。

## 明确不做（第一版）

评论、订阅、多用户、删除文章、修改 slug、后台编辑关于页、独立 Umami/Postgres、CDN、文章内 JSX、原始 HTML。

## 文档怎么拆（确认规划后才写文件）

1. **[docs/requirements/v1.md](docs/requirements/v1.md)**：上述 PRD 全文（角色、故事、字段、页面、规则、验收清单、待定项）。status 用文档自身的「第一版 / 已确认」。
2. **Feature 提示词**（`status: ready`，`related` 指向 PRD）：
   - `docs/agent-prompts/features/2026-08-27-public-reading.md`：公开布局、Markdown 阅读、列表/详情/标签/关于
   - `docs/agent-prompts/features/2026-08-27-search-seo-stats.md`：搜索、暗色模式、RSS/sitemap/OG、SQLite 统计
   - `docs/agent-prompts/features/2026-08-27-admin-posts.md`：登录与文章新建/编辑/草稿/发布、图片上传、`revalidatePath`
3. **Architecture 提示词**：范围收到「按 PRD 初始化工程 + Docker/Caddy」；`related` 加上 PRD 与上述 features。不要再把整站功能只写在这一份里。
4. 更新 [docs/agent-prompts/README.md](docs/agent-prompts/README.md) 的入口列表。

验收标准写入各提示词 checkbox，并与 PRD 验收清单一致。

## 实现顺序（仅在文档 `ready` 之后）

1. 初始化 Next.js 骨架与设计 token（architecture）
2. 公开阅读切片
3. 搜索 / SEO / 暗色 / 统计切片
4. 后台文章切片
5. Docker + Caddy

## 技术选型（实现时遵守，细节以 PRD + [project-conventions.mdc](.cursor/rules/project-conventions.mdc) 为准）

Next.js App Router + TypeScript；运行时读 `content/`，不用 `@next/mdx` 把文章塞进 `app/`；`gray-matter` + `next-mdx-remote/rsc` + `remark-gfm` + Shiki；Flexsearch（中文可用）；next-themes；SQLite 统计；iron-session 类方案；standalone + Compose + Caddy。
