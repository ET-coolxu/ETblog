---
title: Noto 字体切片不要预加载
type: fix
status: in-progress
created: 2026-10-16
updated: 2026-10-16
related:
  - docs/agent-prompts/archive/2026-10-16-local-font-docker-build.md
---

# Noto 字体切片不要预加载

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc` 与相关现有代码。

## 背景

PR #11 的设计验收里，字体家族、字重、`--font-*` 变量、`font-display: swap` 和 `adjustFontFallback` 已通过。分片本身也在，但约 198 个 `localFont` 调用写成了 `preload: true`。浏览器会预加载这些 woff2，不管 `unicode-range`，首屏把 Noto Sans SC 与 Noto Serif SC 的全部汉字切片都拉下来。

生成脚本把 Google CSS 里的 `/* latin */` 一直带到后面没有新注释的 `@font-face`，汉字切片也被当成拉丁，于是 `preload` 被打开。

## 复现步骤

1. 在 `app/fonts/index.ts` 统计 `preload: true`：Noto Sans SC、Noto Serif SC 各约 98 处。
2. 构建后打开首页，首屏网络请求里的 woff2 超过 100。

## 目标

- 只有 Inter 与 Newsreader 的拉丁切片保持 `preload: true`。
- Noto Sans SC、Noto Serif SC 的全部分片（含拉丁切片和 adjust 调用）都是 `preload: false`。
- 生成脚本以后重跑也不会再给 Noto 打开预加载。

## 非目标

- 不改字体家族、字重、unicode-range 分片、CSS 变量名、`font-display` 或 `adjustFontFallback`。
- 不重新下载 woff2，不改页面版式与无关代码。
- 不合并 PR。

## 约束

- 改同一分支 `cursor/local-font-docker-build-19e0`，PR 仍指向 `test`。
- 中文注释说明为什么 Noto 不能预加载。

## 验收标准

- [x] `app/fonts/index.ts` 里 `preload: true` 只出现在 Inter、Newsreader 的拉丁切片（`inter6`、`newsreader2`）
- [x] 本地 `npm run build` 后用无头 Chrome 打开首页，首次加载 17 个 woff2（3 个拉丁预加载 + 页面用到的汉字切片）
- [ ] PR 上的 Docker / next build 仍通过

## 涉及范围

- `scripts/vendor-local-fonts.py`
- `app/fonts/index.ts`

## 实现要点

- 预加载条件是「拉丁切片」并且字体家族是 Inter 或 Newsreader。
- CSS 子集注释只作用于紧跟着的 `@font-face`，避免 `latin` 粘到后续汉字切片。

## 验证

- 构建后用无头 Chromium 打开首页，统计首次加载的 woff2 请求数。
