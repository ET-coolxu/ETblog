---
title: 文章列表标签底色与行距对齐设计稿
type: fix
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - docs/agent-prompts/archive/2026-09-28-posts-list-match-stitch.md
---

# 文章列表标签底色与行距对齐设计稿

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc` 与相关现有代码。

## 背景

`/posts` 全部文章列表上，分类芯片和条目里的 `#标签` 底色，以及「日期 / 标签」到标题、标题到摘要的空隙，和 `D:/docs/blog/design/stitch_coolxu_blog_posts_list/screen.png` 不一致。

稿面纸色是 `#FBFBF9`，芯片是 `#F5F4EF`。本站正文纸色是 `#FAF8F5`，同一枚芯片会发灰发糊。稿面 `screen.png` 按约 1.25 倍导出：芯片下沿到标题字墨约 8px，标题字墨到摘要字墨约 13px（都按 CSS 像素）。

## 复现步骤

1. 打开 `/posts`。
2. 对照 `screen.png` 看分类芯片、条目标签的底色。
3. 对照第一条的日期行、标题、摘要之间的空隙。

## 目标

- 列表页与标签筛选页的内容区纸色改为稿面 `#FBFBF9`，芯片与悬停用稿面 `#F5F4EF` / `#F1EDE9`。
- 全部文章条目：日期行下边距 4px，标题下边距 6px，使字墨空隙接近稿面。
- 分类芯片和条目标签使用同一底色。

## 非目标

- 不改页眉、页脚、首页、搜索、`/tags` 总览、正文页。
- 不改分页、封面尺寸、字体栈。
- 深色模式内容区仍跟现有纸色，不单独铺一块浅色。

## 约束

- 文案中文。颜色走 `globals.css` 的 list token。
- 不提交 git。

## 验收标准

- [x] `/posts` 浅色下芯片计算色为 `rgb(245, 244, 239)`，内容区背景为 `rgb(251, 251, 249)`
- [x] 日期行到标题的字墨空隙约 8–10px，标题到摘要约 12–14px
- [x] 标签筛选页同一套纸色，深色模式仍可读

## 涉及范围

- `app/globals.css`
- `app/(site)/posts/page.tsx`
- `app/(site)/tags/[tag]/page.tsx`
- `components/post-index.tsx`

## 验证方式

- 浏览器打开 `/posts`，量芯片背景和两条空隙，再看一眼标签页。
