---
title: 正文页三列网格：目录不挤占阅读栏
type: optimization
status: done
created: 2026-09-16
updated: 2026-09-16
related:
  - docs/requirements/v1.md
  - app/(site)/posts/[slug]/page.tsx
  - components/table-of-contents.tsx
---

# 正文页三列网格：目录不挤占阅读栏

请按本提示词优化，不要顺手改产品边界。实现前先读 `.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc` 与相关现有代码。

## 背景

`/posts/[slug]` 宽屏用两列网格 `lg:grid-cols-[13rem_minmax(0,42rem)]` 并把「目录 + 正文」整块 `justify-center`。标题区仍是独立的 `max-w-3xl mx-auto`。结果是标题居中、正文被目录往右推、标题比正文列更宽，看起来像「品」字。目录占了阅读栏的位置。

已确认（2026-09-16）：用三列网格；目录放左边；左右两列预留给以后其它侧栏内容。

## 目标

- 宽屏：三列。中间是标题、正文、上一篇/下一篇，同一条居中轴，宽度与站内其它页的 `max-w-3xl`（48rem）一致。
- 左列放目录，贴着阅读栏，不挤占正文宽度。
- 右列先空着，只参与配重，方便以后加内容。
- 窄屏：单列；目录仍用折叠 `<details>`。桌面 sticky 目录只在三列能放下时出现（`xl`，不要在 `lg` 1024px 上硬塞）。

## 非目标

- 不改目录提取、滚动高亮、移动端折叠的交互逻辑。
- 不改首页 / 列表 / 关于等其它页的 `max-w-3xl` 外壳。
- 不在本轮往左右栏加新模块（PV、分享、作者卡等）。
- 不改 Markdown 渲染、封面、相邻文章的数据规则。

## 约束

- 文案中文。颜色仍用 `paper` / `ink` / `muted` / `rule` / `pine`。
- 目录仍是阅读页签名元素，不要用大面积 Hero 替代。
- 无 h2/h3 时不渲染目录；阅读栏仍走中间列，保持居中。
- `TableOfContents` 若继续同时输出移动折叠与桌面侧栏，须让它们成为网格子项（Fragment 或 `display: contents`），并写明列/行位置，避免自动排布把标题、目录、正文错位。
- 桌面目录用 `sticky` + `self-start`，相对正文行粘滞，不要盖住标题。

## 验收标准

- [x] 宽屏（≥1280px）标题、正文、上一篇/下一篇左缘对齐，视觉居中
- [x] 宽屏目录在阅读栏左侧，正文宽度不被目录吃掉（中间列仍约 48rem）
- [x] 再加宽视口时阅读栏仍居中，左右 1fr 变宽；目录贴着中间列而不是贴视口左缘
- [x] 1024px～1279px 与更窄：单列 + 折叠目录，无侧栏
- [x] 无目录的文章中间列仍居中（TOC 为 null 时标题/正文/相邻仍 `xl:col-start-2`）
- [x] 有封面的文章封面跟标题同列，不被目录挤偏
- [x] 目录滚动高亮、移动端折叠仍可用

## 涉及范围

- 文件/模块：`app/(site)/posts/[slug]/page.tsx`、`components/table-of-contents.tsx`
- 度量方式（可选）：浏览器宽屏 / 窄屏对照；标题与正文左缘是否同一条轴

## 实现要点

- 去掉 `max-w-5xl` 两列方案。外壳全宽 + `px-6`；`xl:` 起用 `grid-cols-[minmax(0,1fr)_minmax(0,48rem)_minmax(0,1fr)]`。
- 标题、正文、相邻导航：`xl:col-start-2`。目录桌面 `<nav>`：`xl:col-start-1 xl:row-start-2`，`w-52` + `justify-self-end` 贴阅读栏。
- 侧栏断点从 `lg` 改为 `xl`（与三列同时出现）。折叠目录用 `xl:hidden`，以便 `lg` 仍能打开目录。
- 布局意图用一两句中文注释写在网格上。

## 验证

- 浏览器打开 `/posts/reading-markdown`（有目录）与 `/posts/first-notes`（有封面、有目录）：桌面 ≥1280、约 1100、手机宽。
- 滚动看目录高亮；窄屏点开折叠目录。
- 看首页、文章列表，确认外壳没被改。
