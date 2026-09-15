---
title: 修复上传路由 Response body 的 TS2345
type: fix
status: done
created: 2026-09-15
updated: 2026-09-15
related:
  - docs/agent-prompts/archive/2026-09-14-upload-images-404.md
  - app/uploads/[...path]/route.ts
---

# 修复上传路由 Response body 的 TS2345

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc` 与相关现有代码。

## 背景

PR #1 合入 `main` 后，GitHub Actions 构建镜像失败（run `34939972585`）。`npm run build`（Docker 内 `next build`，实际拉到 Next.js 16.3.3）在 TypeScript 阶段报错：

```
app/uploads/[...path]/route.ts(20,27): error TS2345:
Argument of type 'Buffer<ArrayBufferLike>' is not assignable to parameter of type 'BodyInit | null | undefined'.
```

原因：`readUploadedImage` 返回 Node `Buffer`（`@types/node` 22.20.1 起为 `Buffer<ArrayBufferLike>`），而 `NextResponse` 构造函数的 body 走 DOM `BodyInit`（`BufferSource` 要求 `ArrayBufferView<ArrayBuffer>`）。运行时 Node 仍能把 Buffer 当响应体，只是类型检查不过。

## 复现步骤

1. 在当前依赖下执行 `npm run build`（或 Docker / Actions 里的同一步）。
2. TypeScript 停在 `app/uploads/[...path]/route.ts` 第 20 行。

## 目标

- 消除 TS2345，使 `next build` / Docker 镜像构建能通过类型检查。
- 仍按磁盘字节返回图片、同一套 `Content-Type` / 缓存头；产品行为不变。

## 非目标

- 不改上传、鉴权、路径穿越、扩展名白名单。
- 不改 `content/`、密钥、Caddy / compose。
- 不为压 warning 去改 `fs.readFile` 的 turbopack 追踪提示（与本次失败无关）。

## 约束

- 最小类型修复：把 body 换成 `Uint8Array` 或其它明确兼容 `BodyInit` 的值；不要用会带上 Buffer 底层 pool 多余字节的 `.buffer`。
- 不改访客可见的路由语义。
- 导出函数 / 非显而易见的类型转换写中文注释。

## 验收标准

- [x] `new NextResponse(...)` 不再传入 `Buffer<ArrayBufferLike>`
- [x] 类型上 body 可赋给 `BodyInit`（`Uint8Array` 或等价物）
- [x] 404 与成功响应的状态码、头、读盘逻辑不变
- [x] 未改 `content/` 与无关功能

## 涉及范围

- 文件/模块：`app/uploads/[...path]/route.ts`（必要时仅类型层动 `lib/uploads.ts`）

## 实现要点

- 在构造 `NextResponse` 前把 `result.bytes` 转成 `Uint8Array.from(...)`（或同等拷贝），不要直接传 Node `Buffer`。
- 加一行中文注释说明为何不能直接传 Buffer。

## 验证

- 对照 Actions 日志确认报错行已改掉。
- 无浏览器可点路径；用类型推理 / 能跑则 `npx tsc --noEmit` 或 `npm run build` 确认 TS2345 消失。
