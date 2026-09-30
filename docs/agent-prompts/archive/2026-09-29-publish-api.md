---
title: Publish API 与 CoolXu Blog MCP
type: feature
status: done
created: 2026-09-29
updated: 2026-09-30
related:
  - docs/requirements/v1.md
---

# Publish API 与 CoolXu Blog MCP

请按本提示词实现，不要扩大范围。实现前先读 `.cursor/rules/project-conventions.mdc`、`docs/requirements/v1.md` 第 5.4 节，以及 `node_modules/next/dist/docs/` 里 Route Handler 的当前写法（含动态 `params`）。再读 `lib/posts.ts` 的 `savePost` / `listAdminPosts` / `getAdminPost`，以及 `app/admin/(dashboard)/posts/actions.ts` 的刷新路径。

背景说明在 `D:\docs\blog\impl\publish-api\publish-api-mcp-plan.md`。资讯汇总的正文格式在 `D:\docs\blog\impl\news-digest\digest-post-template.md`。冲突时以本文件和 v1 为准。

## 背景

文章只能写在 `content/posts/{slug}.md`。后台用 session cookie 调 `savePost`。仓库里还没有文章的 HTTP 接口，`app/api/` 只有上传。Cursor 或脚本要发资讯汇总帖，需要一条与网页登录分开的 Bearer 接口，以及一个只转发该接口的本地 MCP。

## 目标

- 提供鉴权 HTTP：新建、更新、列表、读取文章。写入复用 `savePost`，成功后与后台保存刷新同一批路径。
- 同仓提供 stdio MCP，工具只调用上述接口。
- 换机时应用带同一个 `PUBLISH_API_TOKEN`，MCP 只改 base URL。
- 在仓库留下对外契约 `docs/publish-api.md` 与 MCP 的 `README.md`。

## 非目标

- 定时抓取、专职 bot、每 3 天约 10 条的节奏。
- 用 Git commit / PR、SSH 或直写磁盘当发帖通道。
- 删除文章接口、图片上传接口、改 slug、改关于页。
- 单独的 `publish_post` 工具。发布就是 `intent: "publish"`。
- 把「资讯」做成接口必填标签或单独资源。
- 限流、CORS、把 Server Action 改成调 HTTP。
- 把 MCP 打进应用镜像，或把仓库改成 npm workspace。

## 约束

- Markdown 仍是唯一信源。接口只组 `SavePostInput`，再以 `"create"` 或 `"update"` 调用 `savePost`。
- 新建把 `slugHand` 放进 `SavePostInput.slug` 后直接 `savePost(..., "create")`。`savePost` 内部会调用 `allocateCreateSlug`。不要先分配再以 create 模式写入，否则序号会接两次。
- 状态机保持现有文案：存档不能直接发布（「请先改为草稿再发布。」）；草稿不能存档（「草稿不能存档。」）。
- 网页后台继续用 session。Publish API 不接受只带 cookie 的请求。
- `proxy.ts` 的 matcher 维持 `/admin` 与 `/api/upload`。不要把 `/api/v1/posts` 放进 cookie 拦截，否则没有 cookie 的 MCP 会在进路由前被拒绝。
- `PUBLISH_API_TOKEN` 与 `ADMIN_PASSWORD`、`SESSION_SECRET` 分开。只经 Compose 的 `env_file` 在运行时注入，不要做成 Docker build arg，不要写进 GitHub Actions 的构建参数。
- Token 比较：两边先做 SHA-256，再对等长摘要用 `timingSafeEqual`。未配置、缺失、错误都返回同一条 `401`，正文 `{ "ok": false, "error": "unauthorized" }`。不要在日志里打印 token 或 `Authorization`。
- 校验失败沿用 `savePost` 的中文 `error`。`400` 为字段或状态机错误，`404` 为文章不存在，`409` 为 slug 已被使用。非法 slug 返回 `400`，不要当成 `404`。
- 正文仍是 Markdown + GFM。沿用现有渲染（不开启原始 HTML），不要另做一套 HTML 清洗。
- 封面规则沿用 `savePost`：站内路径或 `https://`。
- 缺省日期用 `Asia/Shanghai` 的当天 `YYYY-MM-DD`，与统计的「今日」同一时区。
- 新增或改动的导出函数、鉴权与路径逻辑写中文注释。

## 接口

前缀：`/api/v1/posts`。请求与成功响应均为 JSON。

| 方法 | 路径 | 行为 |
|---|---|---|
| `POST` | `/api/v1/posts` | 新建 |
| `GET` | `/api/v1/posts` | 列表，含草稿与存档。`?status=published\|draft\|archived` 可选；缺省为全部；非法值 `400` |
| `GET` | `/api/v1/posts/{slug}` | 后台视角读取一篇，含正文 |
| `PATCH` | `/api/v1/posts/{slug}` | 部分更新。省略的字段保持磁盘上的值；省略 `intent` 则保持当前状态 |

新建必填：`slugHand`、`title`、`intent`（`draft` \| `publish` \| `archive`）。同时提交 `slug` 则 `400`，避免调用方以为自己指定了最终 slug。

新建可选：`date`、`tags`、`summary`、`cover`、`featured`（默认 `false`）、`body`（默认空字符串）。

更新路径里的 slug 即文件名，创建后不可改。正文里若再带一个不同的 `slug` 或 `slugHand`，返回 `400`。

列表项不含正文：`slug`、`title`、`date`、`tags`、`summary`、`cover`、`featured`、`status`。单篇在此基础上加 `body`。`status` 用 `adminPostStatus` 的 `draft` \| `published` \| `archived`。

写成功：

```json
{ "ok": true, "slug": "ai-digest-12", "status": "published", "url": "/posts/ai-digest-12" }
```

`url` 是站内路径。失败：`{ "ok": false, "error": "..." }`。

写成功后的刷新与 `actions.ts` 里现有路径一致：`/`、`/posts`、该文、`/tags` layout、相关标签页、`/search`、`/feed.xml`、`/sitemap.xml`、`/admin`、该文后台编辑页、`/admin/stats`。把 `revalidatePostSurfaces` 抽到 `lib/revalidate-posts.ts`，后台 action 与接口共用。更新时同时刷新写入前和写入后的标签。

建议落点：

- `lib/publish-auth.ts`
- `lib/revalidate-posts.ts`
- `app/api/v1/posts/route.ts`
- `app/api/v1/posts/[slug]/route.ts`
- `.env.example` 增加空的 `PUBLISH_API_TOKEN=` 及一句说明
- `docs/publish-api.md`：token、四个端点、日期缺省、curl 示例（示例 token 用占位符）
- `mcp/coolxu-blog/`：独立 `package.json`，stdio MCP。根目录不要加 workspaces。把 `mcp/` 写入 `.dockerignore`，应用镜像不包含它

MCP 环境变量：`COOLXU_BLOG_BASE_URL`、`COOLXU_BLOG_TOKEN`。工具：`list_posts`、`get_post`、`create_post`、`update_post`。描述用中文，并写明必填字段。README 说明本地 `http://localhost:3000` 与如何在 Cursor 里配置，不要写入真实 token。

## 验收标准

- [x] 未配置 token、缺少 header、错误 token，响应都是 `401` 且 `error` 为 `unauthorized`
- [x] 只带管理员 cookie、不带 Bearer 的请求被拒绝
- [x] `POST` 且 `intent` 为 `publish`：磁盘上的文件名为 `{slugHand}-{n}`，前台打开 `/posts/{slug}` 可见，无需整站重建
- [x] 省略 `date` 时使用上海当天日期
- [x] 已存档文章 `PATCH` 为 `publish` 返回 `400`，文案为「请先改为草稿再发布。」
- [x] 草稿 `PATCH` 为 `archive` 返回 `400`，文案为「草稿不能存档。」
- [x] 列表含草稿与存档；`?status=` 非法时 `400`；单篇不存在时 `404`
- [x] 后台表单保存仍然成功，并刷新同一批路径
- [x] MCP 的 list / get / create 指向本地 base URL 可以跑通
- [x] 真实 token 未进入 Git；`PUBLISH_API_TOKEN` 不是镜像构建参数
- [x] `docs/publish-api.md` 与 MCP README 能让人用 curl 和 Cursor 配通

## 涉及范围

- 文件/模块：`lib/publish-auth.ts`、`lib/revalidate-posts.ts`、`app/api/v1/posts/`、`app/admin/(dashboard)/posts/actions.ts`（改为调用共用刷新）、`.env.example`、`.dockerignore`、`docs/publish-api.md`、`mcp/coolxu-blog/`
- 不影响：访客阅读契约、`proxy.ts` 的 matcher、上传接口、PV 计入规则、关于页、文章状态机本身

## 实现要点

- 接口层做 JSON 解析、Bearer 校验、字段取舍和 HTTP 状态码。磁盘、序号和状态机留在 `savePost`。
- `PATCH` 先 `getAdminPost`。文章不存在则 `404`。再用磁盘上的现稿填上本次提交的字段，然后 `savePost(..., "update")`。
- 从 `intent` 得到响应里的 `status`：`draft` → `draft`，`publish` → `published`，`archive` → `archived`。未改状态时用 `adminPostStatus`。
- MCP 用 Node `fetch` 调 API。进程跑在本机，不需要给接口加 CORS。
- 资讯样例由人在接口可用后发送，正文按 `digest-post-template.md`：硬标签「资讯」、每条有原链、`intent` 为 `publish`、`slugHand` 用 `ai-digest` 或 `news-digest`。实现任务到接口和 MCP 可用为止，不要在仓库里预写那篇样例稿。

## 验证

- 本地配置 `PUBLISH_API_TOKEN` 后，用 curl 走通：无 token、错 token、新建已发布、打开前台正文、列表、读取、部分更新、非法状态流转。
- 浏览器打开新建文章的前台地址，确认标题、标签和正文；再打开后台列表，确认同一篇出现且状态为已发布。
- 用后台表单再保存一篇或改一篇，确认网页发文没有回归。
- MCP 需在本机启动 stdio 进程后调用工具。生产环境写入 token、以及线上出现样例帖，留到合入部署之后由人验收，不要在实现时 SSH 上服务器发文。
