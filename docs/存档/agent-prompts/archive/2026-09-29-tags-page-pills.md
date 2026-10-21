---
title: 标签总览改为 pill 流
type: optimization
status: done
created: 2026-09-29
updated: 2026-09-29
related:
  - docs/agent-prompts/archive/2026-09-28-posts-list-editorial.md
---

# 标签总览改为 pill 流

请按本提示词优化，不要顺手改产品边界。实现前先读 `.cursor/rules/project-conventions.mdc` 与相关现有代码。视觉以 `D:/docs/blog/design/stitch_coolxu_blog_tags_refined/tags-page-handoff.md` 为准，气质对照同目录 `code.html`。

## 背景

`/tags` 仍是左竖线目录：标签名一行、右侧「N 篇」。定稿是安静的 pill 流：衬线页题「标签」，名称与弱化篇数放在同一枚 pill 里，可折行。点 pill 仍进 `/tags/{名}`。

## 目标

- `/tags` 页题为衬线「标签」，栏宽与留白与关于等窄页一致。
- 已有标签时展示可折行 pill：无衬线名称 + 弱化篇数（数字），无阴影，字号不随热度变化。
- 悬停时名称变为松绿，底色略加深。
- 无标签时保留中文空状态「还没有标签。」。
- 点击仍进入该标签的文章列表（`tagHref`）。

## 非目标

- 不实现「共 N 个主题索引」。
- 不改 `/tags/[tag]` 与 `/posts` 的列表样式。
- 不改顶栏、页脚、搜索、关于、正文、后台。
- 不把顶栏做成 sticky。
- 不做标签云、分类芯片条、卡片阴影。

## 约束

- 颜色只引用 `app/styles/tokens.css` 的变量，不在组件里写死色值。
- 深色模式用同一套结构，pill 底色跟随主题令牌。
- 篇数在界面上只显示数字；读屏补上「篇」。

## 验收标准

- [x] `/tags` 不再使用左竖线目录
- [x] 每个标签是一枚可折行 pill，含名称与弱化篇数，链到 `/tags/{名}`
- [x] 页上没有「共 N 个主题索引」
- [x] 无标签时仍显示「还没有标签。」
- [x] `/tags/[tag]` 列表页未被改动

## 涉及范围

- `app/(site)/tags/page.tsx`
- `app/(site)/tags/page.module.css`
- `app/styles/tokens.css`（仅 pill 底色与边）

## 实现要点

- 页壳继续用 `.page`，标题用衬线，约 32px。
- pill：全圆角、发丝边、浅松绿底；名称约 15px/500，篇数约 12px、弱化色、左边距。
- 悬停只改底色和名称颜色。

## 验证

- 打开 `/tags` 对照 `code.html` 的 pill 流（不含副文案）。
- 点一枚 pill，确认仍是现有标签文章列表。
- 切换深色，确认 pill 仍可读。
