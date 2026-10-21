---
title: 不足一页时隐藏分页
type: optimization
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - docs/agent-prompts/archive/2026-09-28-unify-post-index.md
---

# 不足一页时隐藏分页

请按本提示词优化，不要顺手改产品边界。

## 背景

文章索引只有一页时仍渲染「上一页 / 1 / 1 / 下一页」，两侧都不可点。文章不满一页时没有可翻的页。

## 目标

- `pageCount <= 1` 时不渲染分页。正好一页同样不渲染，因为没有下一页。
- 两页及以上仍显示，不可点的一侧用 dim 色。

## 非目标

- 不改每页 10 篇，不改页码参数。

## 约束

- 判断放在 `Pagination` 里，`/posts` 与标签页一起生效。

## 验收标准

- [x] `/posts` 文章不足或正好 10 篇时没有分页导航
- [x] 超过 10 篇时分页仍在

## 涉及范围

- `components/pagination.tsx`

## 验证

- 打开文章不足一页的 `/posts`，确认没有「上一页」。
