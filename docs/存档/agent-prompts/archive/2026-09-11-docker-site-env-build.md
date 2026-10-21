---
title: Docker 构建打入站点环境变量
type: fix
status: done
created: 2026-09-11
updated: 2026-09-11
related:
  - docs/agent-prompts/archive/2026-09-11-go-live.md
  - docs/vps-go-live.md
---

# Docker 构建打入站点环境变量

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc`。

## 背景

生产 https://coolxu.com 已能访问。文章页、RSS、sitemap（`force-dynamic`）读运行时 `.env`，显示 `CoolXu's Blog`。首页、关于页、`robots.txt` 在 `next build` 时被静态预渲染；`.dockerignore` 排除 `.env`，构建阶段没有 `SITE_NAME` / `AUTHOR_NAME` / `SITE_URL`，于是打成「个人博客」「作者」和 `http://localhost:3000/sitemap.xml`。只重启容器不够，必须带着站点变量重新 build。

## 复现步骤

1. 不把 `.env` 打进构建上下文（当前 `.dockerignore` 如此）。
2. `docker compose up --build`，运行时 `.env` 里已是生产值。
3. 打开 `/` 仍是「个人博客」；`/robots.txt` 的 Sitemap 仍是 localhost；`/posts/[slug]` 已是 CoolXu's Blog。

## 目标

- `Dockerfile` 的 builder（及 runner 默认值）用 **ARG** 接收 `SITE_NAME`、`AUTHOR_NAME`、`SITE_URL`，在 `npm run build` 前写成 `ENV`。
- `docker-compose.yml` 从 `.env` 把这三个值传给 `build.args`。不要把 `ADMIN_PASSWORD`、`SESSION_SECRET` 当作 build arg。
- `robots.ts` 与 sitemap 一样 `force-dynamic`，避免 sitemap URL 再被打成 localhost。
- 更新 `docs/vps-go-live.md`：已上线站点如何 `git pull` 后 `--build`；排查「仍是旧站名」改为必须重新构建，不能只 recreate。

## 非目标

- 不改文章、关于页正文、首页简介。
- 不把 `.env` 从 `.dockerignore` 拿掉（密码不能进镜像层）。
- 不把全站 layout 改成 `force-dynamic` 来换构建参数。

## 约束

- 界面文案中文；站名/作者仍走环境变量。
- ARG 默认值与 `.env.example` 本地占位一致：`个人博客` / `作者` / `http://localhost:3000`。
- 构建相关注释用中文，说明为何不能依赖运行时 `.env` 来改预渲染 HTML。

## 验收标准

- [x] `docker-compose.yml` 的 app `build.args` 含 `SITE_NAME`、`AUTHOR_NAME`、`SITE_URL`
- [x] Dockerfile builder 在 `npm run build` 前 `ENV` 了上述三项；未声明密码类 ARG
- [x] `robots.ts` 为 `force-dynamic`
- [x] `docs/vps-go-live.md` 有「拉代码并重新 build」步骤，成功标准包含首页标题为 CoolXu's Blog、robots sitemap 为 `https://coolxu.com/sitemap.xml`
- [x] 未改 `content/`

## 涉及范围

- `Dockerfile`、`docker-compose.yml`、`app/robots.ts`、`docs/vps-go-live.md`、根 README 一句说明

## 实现要点

- 每个 FROM 阶段要重新 `ARG`。
- compose：`SITE_NAME: "${SITE_NAME}"` 以便撇号安全传入。

## 验证

- 本机不要跑 `docker compose` / `next build`。把 VPS 重建命令写进清单，交给运维助手执行后再看 https://coolxu.com/ 。
