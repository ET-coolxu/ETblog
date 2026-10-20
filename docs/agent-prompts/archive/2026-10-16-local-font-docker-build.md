---
title: Docker 构建改为自托管字体
type: fix
status: done
created: 2026-10-16
updated: 2026-10-16
related: []
---

# Docker 构建改为自托管字体

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc` 与相关现有代码。

## 背景

PR #9 的 Docker / next build（run 38871985522）在 `npm run build` 失败：Turbopack 报 303 次 `Can't resolve '@vercel/turbopack-next/internal/font/google/font'`，并附带 `next/font/google queries have exactly one entry`。根因是 `next/font/google` 在构建时向 Google Fonts 拉 CSS，Google 有时返回带查询串的 `fonts.gstatic.com/l/font?kit=…&skey=…`。`&` 让 Turbopack 的 query 解析认为不止一段，字体模块无法解析。失败集中在 `Noto Sans SC` 的 unicode-range 切片。

## 复现步骤

1. 在干净环境执行与 CI 相同的 `docker build`（镜像内 `npm run build`，Next 16 默认 Turbopack）。
2. `app/layout.tsx` 使用 `next/font/google` 的 Noto Sans SC / Noto Serif SC / Inter / Newsreader。

## 目标

- 构建期不再请求 Google Fonts。
- 用 `next/font/local` 引用仓库内的 woff2。
- 视觉字体不变：Inter 400/500/600，Newsreader 含斜体与 opsz，Noto Sans SC 400/500/700，Noto Serif SC 400/500/600/700。
- 现有 `--font-inter`、`--font-noto-sans`、`--font-newsreader`、`--font-noto-serif` 以及 `--font-sans`、`--font-serif` 名字不变。
- 两套中文 Noto 按 unicode-range 分成多份小 woff2，不要整包一个文件。
- `font-display: swap`，并用 `adjustFontFallback` 生成接近正文字重的 size-adjust 回退。

## 非目标

- 不改页面版式、文案、Markdown 或部署流程。
- 不升级 Next 来绕过该 bug。
- 不改 Open Graph 运行时拉字体的逻辑，除非构建因此失败。

## 约束

- 只改字体加载及相关说明。
- slug、鉴权、内容目录不动。
- 字体文件随仓库分发，Docker 构建阶段不再访问 fonts.googleapis.com / fonts.gstatic.com。

## 验收标准

- [x] 按复现步骤 Docker / next build 通过
- [x] 字体族、字重、CSS 变量名与改前一致
- [x] Noto Sans SC、Noto Serif SC 为多份 unicode-range woff2
- [x] `font-display: swap`，并有 size-adjust 回退
- [x] 公开站与后台仍用原来的 `--font-sans` / `--font-serif`

## 涉及范围

- 文件/模块：`app/layout.tsx`、`app/globals.css`、`app/fonts/`

## 实现要点

- 从 Google Fonts CSS 取出与当前 `next/font/google` 相同的 unicode-range 切片并写入仓库。
- 每个 unicode-range 一次 `localFont`，`declarations` 写入该范围；中文切片 `preload: false`。
- 字重 400 的拉丁静态文件单独做 `adjustFontFallback`（无衬线 Arial，衬线 Times New Roman），避免可变字体默认细字重把回退度量算偏。
- 切片变量在 `body` 上合成原来的 `--font-*`。

## 验证

- 跑 `npm run build`（Dockerfile 里失败的那一步）或完整 `docker build`。
- 确认产物 CSS 含 `unicode-range`、`font-display: swap` 与 `size-adjust`。
