---
title: 列表日期与标签垂直对齐
type: fix
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - docs/agent-prompts/archive/2026-09-28-unify-post-index.md
---

# 列表日期与标签垂直对齐

## 背景

索引行的日期、斜杠、标签不在一条中线上。日期行高 22px，斜杠是 12px，标签在 `li` 的列表行盒里，行盒比芯片更高，标签被挤偏。

## 目标

- 日期、斜杠、标签芯片同一高度，文字在盒子内垂直居中。
- `li` 不再用列表项行盒。

## 非目标

- 不改分类条上的芯片，不改顶栏页脚。

## 验收标准

- [x] 三个元素的盒子顶边和高度一致

## 涉及范围

- `components/post-index.tsx`

## 验证

- `/posts` 第一行量过盒子：顶边都是 289，高度都是 22。
