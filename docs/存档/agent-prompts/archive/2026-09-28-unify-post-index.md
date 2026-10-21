---
title: 文章索引收成一套布局
type: optimization
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - docs/agent-prompts/archive/2026-09-28-posts-list-font-and-layout.md
  - docs/agent-prompts/archive/2026-09-28-posts-list-match-stitch.md
---

# 文章索引收成一套布局

请按本提示词优化，不要顺手改产品边界。实现前先读 `.cursor/rules/project-conventions.mdc` 与相关现有代码。

## 背景

`/posts` 和 `/tags/[tag]` 为了对齐两张 Stitch 屏，各有一套行样式和分页。差异只是间距、字号、分隔符、封面在窄屏是否通栏、页码放左边还是右边。`post-index.tsx` 用一张变体表把这些差异散在类名里，改一处要同时改两套。后面没法维护。

## 目标

- 全部文章和标签筛选共用同一套索引行、封面和分页。
- 页面只负责取数和页头；列表、空状态、分页放进一个视图组件。
- 翻页下标的计算收成一个函数，两页不再各写一遍。
- 当前标签仍用薄荷绿标出。点标签进标签页，点行的其余区域进正文。

## 非目标

- 不改顶栏、页脚、正文页、首页。
- 不删 `/posts?tag=` 和 `/tags/[tag]` 这两条路由。
- 不改每页 10 篇、草稿可见性、`tagHref`。
- 不追求和两张设计稿逐像素一致。

## 约束

- 列表字体继续用 `.list-serif` / `.list-sans`，不要改回全站字体栈。
- 中文注释写在本次新增的导出函数上。

## 验收标准

- [x] `PostIndexList` 和 `Pagination` 不再接收 `variant`
- [x] `/posts` 与 `/tags/[tag]` 的行结构、封面尺寸、分页位置相同
- [x] 带标签的列表里，当前标签仍是薄荷绿
- [x] 空列表仍有中文空状态
- [x] 顶栏和页脚未被改动

## 涉及范围

- `components/post-index.tsx`
- `components/pagination.tsx`
- `app/(site)/posts/page.tsx`
- `app/(site)/tags/[tag]/page.tsx`

## 实现要点

- 删掉 `archive` / `tag` 两套类名。行样式以全部文章那套为准。
- 分页只用一种：上一页、页码、下一页。
- 页切片放在 `slicePage`。

## 验证

- 打开 `/posts` 和 `/tags/Markdown`，看行、封面、分页是否同一套。
- 打开一个没有文章的标签，看空状态。
