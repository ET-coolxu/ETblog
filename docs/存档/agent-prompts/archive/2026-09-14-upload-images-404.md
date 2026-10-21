---
title: 运行时上传的图片访问 404
type: fix
status: done
created: 2026-09-14
updated: 2026-09-14
related:
  - docs/agent-prompts/archive/2026-08-27-admin-posts.md
  - docs/agent-prompts/archive/2026-09-14-upload-origin-behind-proxy.md
  - lib/uploads.ts
---

# 运行时上传的图片访问 404

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc` 与相关现有代码。

## 背景

生产站上传已成功（文件在宿主机 `public/uploads/` 里），正文插入 `![说明](/uploads/2026/09/….png)`。打开该 URL 却是站点 404 页（「没有找到这个页面」），不是 Caddy 裸 404。

对照：构建时就在仓库里的 `https://coolxu.com/uploads/2026/08/cover-notes.svg` 能显示。

原因：`output: 'standalone'` 的生产服务只对外提供 **构建时** `public/` 清单里的文件。运行时写入卷的新图在磁盘上，但不在清单里，请求落入 App Router，没有对应路由，于是 `not-found`。本地 `next dev` 会现读 `public/`，所以本地不容易复现。

## 复现步骤

1. 后台上传一张允许类型的图片，确认服务器 `public/uploads/{yyyy}/{mm}/` 有文件。
2. 发布文章，正文含 `![…](/uploads/…)`。
3. 打开文章页或直接访问该 `/uploads/…` URL，图片 404。

## 目标

- `GET /uploads/{yyyy}/{mm}/{filename}` 对已存在的上传文件返回图片字节与正确 `Content-Type`。
- 路径穿越、缺文件、非允许扩展名：404（不要站点 HTML 壳，方便 `<img>`）。
- 仍写 `public/uploads/`，Markdown 仍用 `/uploads/...`，不改上传接口与编辑器。

## 非目标

- 不改 Caddyfile / compose 卷拓扑来改由 Caddy 直接出图（可另做，本次用应用内路由即可）。
- 不改上传类型/大小限制，不开放 SVG 上传。
- 不改文章 Markdown 语法。

## 约束

- 读盘必须防路径穿越，复用或延伸 `lib/uploads.ts` 的根目录约束。
- 只允许提供 png / jpg / jpeg / webp / gif，以及仓库里已有的示例 svg（只读，不表示可上传）。
- Route Handler 用 Node runtime；`params` 按 Next 16 写成 `Promise`。
- 新增导出函数写中文 JSDoc。

## 验收标准

- [x] 磁盘上已有的运行时上传图，经 `/uploads/…` 能以图片响应打开
- [x] `..`、越出 `public/uploads` 的路径 404
- [x] 不存在的文件 404
- [x] 上传写入路径与返回 URL 未改
- [x] 构建期示例 `/uploads/2026/08/cover-notes.svg` 仍可访问（静态或同一路由均可）

## 涉及范围

- 文件/模块：`lib/uploads.ts`、`app/uploads/[...path]/route.ts`
- 不影响：`post-editor.tsx`、上传 POST、Caddy、鉴权

## 实现要点

- 在 `lib/uploads.ts` 增加「按相对路径安全读文件」的导出函数。
- 新增 `GET` Route Handler，把 catch-all 拼成相对路径后读盘并返回。
- 成功响应加合理 `Cache-Control`（文件名含时间戳，可长期缓存）和 `X-Content-Type-Options: nosniff`。

## 验证

- 读代码确认穿越防护与扩展名白名单。
- 生产需重新 `--build` 部署后，打开已 404 的那张图 URL 与文章页。
