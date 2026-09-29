---
title: 文章列表背景与其它页面统一
type: fix
status: done
created: 2026-09-29
updated: 2026-09-29
related:
  - docs/agent-prompts/archive/2026-09-28-list-chip-spacing.md
---

# 文章列表背景与其它页面统一

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc` 与相关现有代码。

## 背景

全站页面底色是 `body` 的 `--paper`（浅色 `#faf8f5`）。文章索引（`/posts` 与 `/tags/[tag]`）在 `PostIndexView` 上另铺 `--list-surface`（浅色 `#fbfbf9`），页眉页脚之间会比首页、关于、搜索、标签云更白一档。深色模式里 `--list-surface` 已经等于 `--paper`，只有浅色模式能看出来。

## 复现步骤

1. 打开首页或关于页，记住页眉与页脚之间的纸色。
2. 打开 `/posts`（以及带标签筛选的列表）。
3. 对比：列表内容区比其它页面更冷、更白。

## 目标

- `/posts` 与 `/tags/[tag]` 的页面背景与其它公开页相同，都是 `--paper`。
- 去掉因此不再使用的 `--list-surface`。

## 非目标

- 不改列表芯片、分隔线、字色等其它 `--list-*` 令牌。
- 不改页眉、页脚、首页或正文页的样式。

## 约束

- 颜色只引用 `app/styles/tokens.css` 的变量，不写死色值。
- 列表页仍用纵向 flex，短内容时页脚留在视口底部。

## 验收标准

- [x] 浅色模式下 `/posts` 与首页、关于页的背景同为 `--paper`
- [x] `/tags/[tag]` 与 `/posts?tag=` 同样不再使用单独底色
- [x] `--list-surface` 无残留引用
- [x] 深色模式列表背景仍与其它页面一致

## 涉及范围

- `components/post-index.module.css`
- `app/styles/tokens.css`
- `app/(site)/layout.module.css`（只改已过时的注释）

## 实现要点

- 删掉索引页容器上的 `background: var(--list-surface)`，让 `body` 的 `--paper` 透出来。
- 浅色与深色令牌里都删掉 `--list-surface`。

## 验证

- 对照首页与 `/posts` 的背景；再打开一个标签列表页确认共用同一组件。
