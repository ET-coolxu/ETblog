---
title: 反代后上传图片误报来源不被允许
type: fix
status: done
created: 2026-09-14
updated: 2026-09-14
related:
  - docs/agent-prompts/archive/2026-08-27-admin-posts.md
  - app/api/upload/route.ts
---

# 反代后上传图片误报来源不被允许

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc` 与相关现有代码。

## 背景

生产站 `https://coolxu.com/admin/posts/new` 已登录，选图上传却返回 **403**，文案「请求来源不被允许。」。这不是未登录（未登录是 401「请先登录。」）。

`app/api/upload/route.ts` 的 `isSameOrigin` 拿浏览器 `Origin` 和 `request.url` 的 origin 做全等比较。Caddy `reverse_proxy app:3000` 后，Next 看到的是容器内地址（Host 默认成上游 `app:3000`，协议是 `http`），典型为 `http://app:3000`；浏览器 Origin 仍是 `https://coolxu.com`。即便补上 `Host`，协议仍是 `http` vs `https`，一样对不上。

本地 `npm run dev` 直连时两边都是 `http://localhost:3000`，所以本地不容易复现。

## 复现步骤

1. 经 Caddy / Docker 打开 `https://coolxu.com/admin/posts/new` 并登录。
2. 选择、拖拽或粘贴一张允许类型的图片。
3. 接口 `POST /api/upload` 返回 403，编辑器显示「请求来源不被允许。」

## 目标

- 已登录且来自本站（`SITE_URL` 的 origin，例如 `https://coolxu.com`）的上传应通过来源校验。
- 本地直连开发（Origin 与 `request.url` 一致）仍可通过。
- 缺 Origin、或 Origin 不是本站，仍 403。未登录仍 401。

## 非目标

- 不改 Caddyfile / Docker 拓扑来「凑」request.url。
- 不放开未登录上传，不改文件类型/大小限制。
- 不改编辑器 UI，不引入 CORS 对外域开放。

## 约束

- 仍须登录（`hasAdminSession`）才能上传。
- 不要信任客户端自报的 `X-Forwarded-Host` 作为唯一白名单（可被伪造）；以 `SITE_URL` 为准。
- `request.url` 的 origin 可作为**额外**允许项，方便本地直连。
- 新增/改动的校验函数写中文 JSDoc，说明为何不能只比 `request.url`。

## 验收标准

- [x] `Origin` 等于 `SITE_URL` 的 origin 时，已登录上传不再因来源校验 403
- [x] 本地直连（Origin 等于 `request.url` origin）仍可通过
- [x] 无 Origin、或 Origin 既不是 `SITE_URL` 也不是 `request.url` 的 origin，仍 403
- [x] 未登录仍 401，文案不变
- [x] 图片类型/大小校验逻辑未改

## 涉及范围

- 文件/模块：`app/api/upload/route.ts`
- 不影响：`components/post-editor.tsx` 的 fetch、Caddy、鉴权 cookie 本身

## 实现要点

- 把「只比 `request.url`」改成：规范化后的 Origin 命中 `{SITE_URL origin, request.url origin}` 任一即可。
- `SITE_URL` 用现有 `getSiteConfig().url`，不要新造环境变量。
- Origin 缺失继续拒绝（防部分 CSRF）。

## 验证

- 读代码确认比较集合含 `SITE_URL`。
- 生产需重新部署镜像后，在写文章页实际上传一张图；未部署前无法在线上验证。
- 未登录、非法文件类型等相邻路径逻辑保持原状。
