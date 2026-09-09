---
title: 从零搭建工程骨架与部署配置
type: architecture
status: done
created: 2026-08-27
updated: 2026-08-27
related:
  - docs/requirements/v1.md
  - docs/agent-prompts/features/2026-08-27-public-reading.md
  - docs/agent-prompts/features/2026-08-27-search-seo-stats.md
  - docs/agent-prompts/features/2026-08-27-admin-posts.md
---

# 从零搭建工程骨架与部署配置

请按本提示词初始化可自托管的 Next.js 工程与 Docker/Caddy 配置。不要在本文件里实现阅读、搜索、后台等产品功能。实现前先读 `.cursor/rules/project-conventions.mdc` 与 `docs/requirements/v1.md`。

## 背景

仓库几乎是空的，只有约定和需求文档。需要先有可运行的 App Router 骨架和 VPS 部署文件，后续功能按 feature 提示词切片添加。

## 目标

- 初始化 Next.js App Router + TypeScript + Tailwind；`output: 'standalone'`。
- 目录预留：`app/(site)/`、`app/admin/`、`content/posts/`、`content/pages/`、`public/uploads/`、`lib/`。
- 全站极简布局壳（导航/页脚可用占位链接）、设计 token（阅读优先、克制衬线标题、暗色模式预留 class）。
- 站点文案与名称走环境变量：`SITE_NAME`、`AUTHOR_NAME`、`SITE_URL`、`ADMIN_PASSWORD`、`SESSION_SECRET`、可选 `ADMIN_USER`。提供 `.env.example`。
- `next.config` 设置 standalone，并避免反向代理缓冲流式响应（如 `X-Accel-Buffering: no`）。
- Docker Compose + Caddy HTTPS 配置；卷：`content/`、`public/uploads/`、SQLite 数据目录。本地至少能 `docker compose` 起服务或在 README 写明缺口。

## 非目标

- 不要实现 Markdown 文章渲染、搜索、统计、后台登录与编辑。那些分别见 related 中的 feature 提示词。
- 评论、邮件订阅、多作者、独立 Umami/Postgres、CDN。
- 不要用 `@next/mdx` 把文章塞进 `app/`。

## 决策

| 决策 | 选择 | 不选 |
|---|---|---|
| 文章信源 | `content/posts/{slug}.md`（后续切片实现读写） | 数据库再存一篇 |
| 文章进路由 | 运行时读 Markdown（后续切片） | `@next/mdx` 塞进 `app/` |
| 部署 | `output: 'standalone'` + Docker Compose + Caddy | 绑定 Vercel |
| 搜索 | 服务端 Flexsearch（后续切片） | Elastic |
| 统计 | 应用内 SQLite（后续切片） | 额外 Umami |

## 约束

- 界面占位文案用中文。站名/作者不要写死。
- 阅读优先，偏个人笔记本，不要通用 SaaS 着陆页。
- 代码走 Git；VPS 上 `content/`、`public/uploads/`、SQLite 目录用数据卷持久化。
- 产品字段与页面行为以 `docs/requirements/v1.md` 为准，本切片只搭空壳。

## 影响面

- 目录/模块：`app/` 布局壳、`lib/` 空模块可暂不写业务、`Dockerfile`、`docker-compose.yml`、`Caddyfile`、`.env.example`、根 README（如何开发与 compose 启动）。
- 数据流：尚无文章读写。
- 部署：Compose 将 Caddy 反代到 Next 3000 端口。
- 需要同步修改的规则或提示词：若目录与约定不符，先改 `.cursor/rules/project-conventions.mdc`。

## 验收标准

- [x] `next dev` 能打开中文占位首页（站名来自环境变量）（文件已就绪；需本地 `npm install` 后自行打开确认）
- [x] 已预留 `content/`、`public/uploads/`、`app/(site)/`、`app/admin/` 目录
- [x] `output: 'standalone'` 与反向代理流式头已配置
- [x] 有 `.env.example` 与 Docker Compose + Caddy；卷包含 content、uploads、sqlite
- [x] 未实现 PRD 里的阅读/搜索/后台功能（留给后续提示词）

## 实现顺序

1. 创建 Next.js 项目、Tailwind、设计 token、根布局与占位首页。
2. 补环境变量示例与目录占位。
3. 写 Dockerfile（standalone）、Compose、Caddyfile。
4. 根 README 写本地开发与 compose 命令。

## 验证

- 本地 `next dev` 打开占位页。
- 部署配置至少能本地 `docker compose` 起服务或给出明确缺口。
- 不要在本切片用浏览器验收文章详情或后台发文。
