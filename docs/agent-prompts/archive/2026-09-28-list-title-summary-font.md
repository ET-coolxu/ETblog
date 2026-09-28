---
title: 列表标题和摘要改回稿面字体
type: fix
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - docs/agent-prompts/archive/2026-09-28-posts-list-match-stitch.md
  - D:/docs/blog/design/stitch_coolxu_blog_posts_list/code.html
---

# 列表标题和摘要改回稿面字体

请按本提示词修复，不要顺手做无关重构。

## 背景

`/posts` 索引行的标题用了 `font-serif`（Newsreader 之后是 Noto Serif SC），摘要继承全站 Literata。稿面 `headline-sm` 只有 Newsreader，`body-sm` 只有 Inter。中文因此应落到无衬线，而不是宋体。现在「读 Markdown 时我会注意什么」和它的摘要看起来比设计稿硬。

## 复现步骤

1. 打开 `/posts`
2. 看第二行「读 Markdown 时我会注意什么」及其摘要

## 目标

- 列表与标签筛选的条目标题：拉丁字母 Newsreader，中文用苹方 / 微软雅黑 / Noto Sans SC，不用宋体。光学尺寸固定在默认正文切，不要随字号变展示字。
- 摘要：Inter，中文同样走无衬线。全部文章屏为 13px、`leading-relaxed`；标签屏保持 15px / 26px。

## 非目标

- 不改正文页标题和 `.markdown`。
- 不改页题「文章」、日期、标签 pill、顶栏。

## 约束

- 颜色和字号保持现有稿面数值。

## 验收标准

- [x] 该行标题的中文计算字体不是 Noto Serif SC / 宋体
- [x] 该行摘要的计算字体是 Inter 系无衬线，不是 Literata
- [x] 正文页标题仍是衬线中文

## 涉及范围

- `app/globals.css`、`components/post-index.tsx`

## 验证

- `/posts` 第二行，以及 `/posts/first-notes` 标题。
