---
title: 正文纸色、光学字号与标签芯片
type: optimization
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - docs/agent-prompts/archive/2026-09-28-post-page-editorial.md
  - D:/docs/blog/design/stitch_coolxu_blog_post_page/code.html
---

# 正文纸色、光学字号与标签芯片

请按本提示词调整正文的字体气质和标签，目录仍在左侧。对照 `D:/docs/blog/design/stitch_coolxu_blog_post_page/`。

## 背景

字号和行距已按稿子设置，但标题用的是 Newsreader 正文切割，中文正文被 Noto Sans SC 截住，纸色偏冷，标题和正文同一墨色。标签用了 `text-muted` 和默认圆角，行盒还被正文 16px 撑到约 25px，比稿子里的 `label-sm` 芯片又淡又高。

## 目标

- Newsreader 加载 `opsz`，大标题用展示字。
- 正文与标签的中文先用苹方 / 微软雅黑，Noto Sans SC 只作兜底。
- 纸色改为 `#FAF8F5`，标题墨色 `#1C1E21`，正文 `#2B2A27`。顶栏与正文同一张纸，避免接缝。
- 标签对齐稿面：底 `#efeeeb`、字 `#414943`、11px、字重 600、字距 0.08em、行高 1rem、圆角 2px、左右 10px 上下 2px。悬停仍变松绿，并链到标签页。

## 非目标

- 不改目录位置、阅读栏宽度、Shiki 主题。
- 不把全站正文从 Literata 改成 Inter。
- 不改首页标签的松绿样式。

## 约束

- 新颜色进 `globals.css` 的 token，组件里不写散落色值。
- 深色模式给新 token 对应色，避免芯片和正文糊掉。
- 引用保留 Newsreader 斜体；中文不要合成斜体。

## 验收标准

- [x] 宽屏标题的 Newsreader 带光学尺寸，正文中文字体栈在 Noto Sans 之前有系统黑体
- [x] 正文颜色比标题软，页面底色为暖纸
- [x] 文章标签为浅底深字小芯片，行高约 20px，不是 25px 的淡灰字
- [x] 标签仍进入 `/tags/...`；深色模式下正文和标签可读

## 涉及范围

- `app/layout.tsx`、`app/globals.css`、`app/(site)/posts/[slug]/page.tsx`

## 验证

- `/posts/first-notes` 或 `/posts/test` 看标题、正文、标签。切换深色看一眼对比。
