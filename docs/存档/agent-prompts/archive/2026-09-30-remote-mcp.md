---
title: 远程 MCP
type: feature
status: done
created: 2026-09-30
updated: 2026-09-30
related:
  - docs/agent-prompts/archive/2026-09-29-publish-api.md
  - docs/requirements/v1.md
---

# 远程 MCP

请按本提示词实现，不要扩大范围。实现前先读 `.cursor/rules/project-conventions.mdc`、`docs/requirements/v1.md` 第 5.4 节，以及现有 `lib/publish-auth.ts`、`lib/publish-posts.ts`。

## 背景

Publish API 已经可以用 Bearer 远程发文。本地 MCP 是 stdio 进程，只能在装了这个包的电脑上由 Cursor 拉起。有些 AI 客户端不能配置本地进程，只能填一个远程地址。

## 目标

- 在现有 Next 应用上提供远程 MCP：`/api/mcp`。
- 协议用 SDK 的 Streamable HTTP，无会话，响应用 JSON，避免反向代理缓冲 SSE。
- 工具与本地 MCP 相同：`list_posts`、`get_post`、`create_post`、`update_post`。
- 工具直接调用现有的 `savePost` 与读取函数，不向本机再发一遍 HTTP。
- 鉴权与 Publish API 相同：`Authorization: Bearer`，使用 `PUBLISH_API_TOKEN`。

## 非目标

- 不删除本地 stdio MCP。
- 不实现已弃用的旧版独立 SSE 传输。
- 不新做一套写盘逻辑，不加删除、上传、OAuth。
- 不把 MCP 打进另一条公网端口；仍由现有 Caddy 转到应用。

## 约束

- 只带后台 cookie、不带 Bearer 的请求拒绝。未配置、缺失、错误 token 都是 `401`，正文 `{ "ok": false, "error": "unauthorized" }`。
- 不把 `/api/mcp` 放进 `proxy.ts` 的 cookie 拦截。
- 不在日志里打印 token 或 `Authorization`。
- 依赖加在应用根目录，版本与 `mcp/coolxu-blog` 里的 SDK、zod 对齐。不要做成 Docker build arg。
- 新增导出函数写中文注释。

## 验收标准

- [x] 无 token、错 token、只带 cookie：`401` 且 `error` 为 `unauthorized`
- [x] 带正确 Bearer 的远程客户端能完成初始化并列出四个工具
- [x] `list_posts` 能读到现有文章
- [x] `create_post` 写出的文件名是 `{slugHand}-{n}`，随后测试稿删除，不留在仓库里
- [x] 本地 stdio MCP 的代码还在，`proxy.ts` 的 matcher 未改

## 涉及范围

- 文件：`app/api/mcp/route.ts`、`lib/remote-mcp.ts`、根 `package.json`、`docs/publish-api.md`、`docs/requirements/v1.md`、`mcp/coolxu-blog/README.md`
- 不影响：访客页面、文章状态机、本地 stdio 的工具参数

## 实现要点

- 每个请求新建 MCP server 和 transport。`sessionIdGenerator` 不设，表示无会话。`enableJsonResponse: true`。
- GET 会保持 SSE 流，不要在返回响应后关掉这次连接。POST / DELETE 可以在响应完成后关闭 server。

## 验证

- 用 SDK 的 Streamable HTTP 客户端连 `http://localhost:3000/api/mcp`，带本地 token，走通初始化、列工具、列文章、建一篇草稿。
- 删掉测试稿。生产环境沿用已有的 `PUBLISH_API_TOKEN`，不要为远程 MCP 再加一个密钥。
