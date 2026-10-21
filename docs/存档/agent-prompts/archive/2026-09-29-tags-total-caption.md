---
title: 标签页题下显示总数
type: optimization
status: done
created: 2026-09-29
updated: 2026-09-29
related:
  - docs/agent-prompts/archive/2026-09-29-tags-page-pills.md
---

# 标签页题下显示总数

请按本提示词优化，不要顺手改产品边界。实现前先读 `.cursor/rules/project-conventions.mdc` 与 `app/(site)/tags/page.tsx`。文案与位置以 `D:/docs/blog/design/stitch_coolxu_blog_tags_refined/screen.png` 为准。

## 背景

`/tags` 页题「标签」下面没有总数说明。稿面在标题下有一行弱化文案「共 N 个主题索引」，N 为标签个数。上一份提示词曾把它标成可不实现，现按页面要求补上。

## 目标

- 页题正下方显示「共 {标签数} 个主题索引」。
- 无衬线、约 13–14px、字距略宽、颜色用弱化色，与标题间距约 8px，与下方 pill 间距约 32px。
- 没有标签时仍显示「共 0 个主题索引」，空状态文案不变。

## 非目标

- 不改 pill、不改 `/tags/[tag]`、不改顶栏页脚。

## 约束

- 颜色和字号只用 `app/styles/tokens.css` 已有变量。
- N 是 `listTags()` 的条数，不是文章篇数。

## 验收标准

- [x] 有标签时，标题下为「共 N 个主题索引」，N 与 pill 个数一致
- [x] 该行在标题与 pill 之间，弱于标题
- [x] 无标签时标题下仍有「共 0 个主题索引」，并保留「还没有标签。」

## 涉及范围

- `app/(site)/tags/page.tsx`
- `app/(site)/tags/page.module.css`

## 实现要点

- 把标题和说明包在同一个页头里，说明用 `--quiet` 与 `--font-list`。
- pill 列表不再单独撑开与标题的距离，改由页头下边距留白。

## 验证

- 打开 `/tags`，对照 `screen.png` 看说明的位置和文案。
