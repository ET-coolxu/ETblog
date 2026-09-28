---
title: 文章列表与标签筛选对齐 Stitch 屏
type: optimization
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - docs/agent-prompts/archive/2026-09-28-posts-list-editorial.md
  - D:/docs/blog/design/stitch_coolxu_blog_posts_list/code.html
  - D:/docs/blog/design/stitch_coolxu_blog_posts_list/screen.png
  - D:/docs/blog/design/stitch_coolxu_blog_posts_list/markdown/code.html
  - D:/docs/blog/design/stitch_coolxu_blog_posts_list/markdown/screen.png
---

# 文章列表与标签筛选对齐 Stitch 屏

请按本提示词优化。视觉以两份 `code.html` 和对应 `screen.png` 为准，不要再按交接说明砍掉页头装饰和分类条。

## 背景

上一版列表只用了现有 token 和「年月日 · 标签」，页头没有 ARCHIVE 与分类芯片，标签 pill 偏深，分页在只有一页时被藏掉。和稿面的间距、字色、日期、封面圆角都不一致。

## 目标

- `/posts` 对齐「文章 · 全部」：衬线页题 32/42、右侧 `ARCHIVE / NN`、其下「N 篇记录」、发丝线、分类芯片（「全部」实心底，其余 `#标签` 浅底）、索引行、底部分页。
- 索引行：等宽 `YYYY-MM-DD`、`/`、浅底 `#标签`、20px/500 标题悬停变 `#3a674f`、13px 摘要最多两行。封面 104×72、细边 `#E2DFD8`、约 2px 圆角；无封面不留位。
- `/posts?tag=` 与 `/tags/[tag]` 对齐「标签：Markdown」：返回链接、页题与「包含此标签的文章共 N 篇」、行距更大、标题 24px/400、当前标签薄荷绿底、摘要桌面一行。分页在左侧上一页/下一页，右侧「第 x / y 页」。
- 只有一页也显示分页，不可点的一侧用 dim 色。
- 浅色用稿面色值；深色落到现有纸色，不改全站 token。
- 顶栏页脚、搜索、标签总览、正文、首页不动。

## 非目标

- 不写稿面里的示例句子（「关于思考、设计与书写」、标签简介）。没有对应数据。
- 不改 `tagHref`、草稿可见性、每页 10 篇。
- 不引入 Material Symbols。

## 约束

- 日期用文章的 `date` 原文，等宽字体只服务日期、ARCHIVE 和页码。
- 分类芯片链到 `/tags/[tag]`，「全部」留在 `/posts`。
- 标签链接盖在整行点击层上。
- 文案中文。

## 验收标准

- [x] `/posts` 页头、分类条、行距、日期、pill、封面、分页与全部文章屏一致
- [x] 标签筛选页的返回、标题、当前标签色、行内标题字号、分页与标签屏一致
- [x] 点封面或摘要进正文，点标签进标签页
- [x] 深色下仍可读
- [x] 搜索与 `/tags` 总览未被改成新索引

## 涉及范围

- `app/globals.css`、`app/layout.tsx`、`components/post-index.tsx`、`components/pagination.tsx`、`app/(site)/posts/page.tsx`、`app/(site)/tags/[tag]/page.tsx`

## 验证

- 对照两张 screen.png 看 `/posts` 与 `/tags/Markdown`。
- 窄屏、深色、空标签、搜索页各看一眼。
