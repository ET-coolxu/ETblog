---
title: 目录回到左侧，正文保持居中
type: fix
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - docs/agent-prompts/archive/2026-09-28-post-page-editorial.md
  - docs/agent-prompts/archive/2026-09-16-post-toc-three-column.md
---

# 目录回到左侧，正文保持居中

请按本提示词修改。正文排印仍以 `docs/agent-prompts/archive/2026-09-28-post-page-editorial.md` 为准，只改目录位置。

## 背景

Quiet Editorial 稿把目录放在阅读栏右侧，并用 flex 把「正文 + 目录」当成一组居中，正文因此偏左。此前已确认的布局是：目录在左、不占阅读栏宽度、正文始终居中。

## 目标

- `xl` 起三列：左右 `1fr` 配重，中间阅读栏仍为 760px，有无目录都居中。
- 桌面目录在左列，贴着阅读栏，sticky。不把正文挤窄或挤偏。
- 窄于 `xl`：不显示侧栏，折叠目录仍在题头和正文之间。

## 非目标

- 不改题头、正文排印、封面、上下篇、目录高亮规则。
- 不改顶栏和首页。

## 约束

- 无 h2/h3 时不渲染目录，阅读栏仍居中。
- 侧栏断点仍是 `xl`。

## 验收标准

- [x] 宽屏正文左缘与视口居中的 760px 栏对齐，不因目录偏左
- [x] 宽屏目录在正文左侧，正文宽度仍约 760px
- [x] 窄屏只有折叠目录
- [x] 无目录的文章仍居中

## 涉及范围

- `components/table-of-contents.tsx`、`app/(site)/posts/[slug]/page.tsx`

## 验证

- `/posts/first-notes` 宽屏与手机宽；`/posts/test` 无目录。
