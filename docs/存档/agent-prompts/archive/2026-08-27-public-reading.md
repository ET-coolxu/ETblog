---
title: 公开阅读：布局、Markdown 正文、列表/标签/关于
type: feature
status: done
created: 2026-08-27
updated: 2026-08-28
related:
  - docs/requirements/v1.md
  - docs/agent-prompts/archive/2026-08-27-nextjs-personal-blog-v1.md
---

# 公开阅读：布局、Markdown 正文、列表/标签/关于

请按本提示词实现，不要扩大范围。实现前先读 `.cursor/rules/project-conventions.mdc`、`docs/requirements/v1.md` 与相关现有代码。产品细节以 PRD 为准。

## 背景

工程骨架就位后，访客还不能读文章。需要把 `content/` 下的 Markdown 渲染成公开站点，并带上全站导航与阅读页体验。

## 目标

- 公开布局：导航（站名、文章、标签、关于、搜索入口）、页脚（作者占位、RSS 链接占位）。站名/作者来自 `SITE_NAME` / `AUTHOR_NAME`，不要写死。
- 运行时读取 `content/posts/{slug}.md` 与 `content/pages/about.md`，按 PRD 解析 frontmatter。
- 页面：`/`、`/posts`、`/posts/[slug]`、`/tags`、`/tags/[tag]`、`/about`。
- 正文：GFM、Shiki 代码高亮、h2/h3 目录（桌面随滚动高亮，移动端折叠）、封面、阅读时间（约 300 字/分钟）、上一篇/下一篇。
- 至少 2 篇示例文章（1 篇可 `featured`，1 篇 `draft`）和一份关于页，便于验收。

## 非目标

- 搜索实现、RSS/sitemap/OG 完整输出、暗色模式逻辑、访问统计、管理后台。
- 评论、订阅、删除文章、改 slug、后台编辑关于页。
- 搜索入口可先链到 `/search`，该页本切片可放「即将提供」占位，不要在本切片做全文检索。

## 约束

- 遵守 Markdown 唯一信源、中文文案、第一版不做评论/订阅/多用户。
- 不要用 `@next/mdx` 把文章塞进 `app/`。
- 正文不渲染原始 HTML，不允许 JSX 组件。
- `draft: true` 对访客：不进列表/标签/首页；直链 404。
- slug 仅 `[a-z0-9-]+`，读写防路径穿越。
- `/posts` 每页 10 篇，按 date 降序，支持 `?tag=`。首页最新最多 6 篇；有 `featured` 则优先展示精选。
- 关于页缺文件显示空状态，不 500。
- 阅读页签名元素是侧栏目录，不要大面积 Hero。

## 验收标准

- [x] 首页展示简介、精选（若有）、最新已发布（最多 6 篇）
- [x] `/posts` 分页、可按标签筛选；草稿不出现
- [x] `/posts/[slug]` 渲染 GFM、Shiki、封面、阅读时间、h2/h3 目录、上一篇/下一篇
- [x] 访客打开草稿或不存在 slug 得到 404
- [x] `/tags`、`/tags/[tag]`、`/about` 符合 PRD；关于页缺文件不 500
- [x] 导航与页脚为中文；站名/作者来自配置

## 涉及范围

- 文件/模块：`app/(site)/` 各页面、`lib/posts.ts`、`lib/markdown.ts`、全站布局与设计 token 落地、`content/posts/`、`content/pages/about.md`
- 不影响：`app/admin/`、搜索索引、SQLite、Docker（已有配置则不要改坏）

## 实现要点

- `gray-matter` + `next-mdx-remote/rsc` + `remark-gfm` + Shiki + slug/autolink。
- 列表卡片：标题、日期、标签、summary（空则截正文约 120 字）、可选封面。
- 仓库带示例 md，方便本地打开验收。

## 验证

- 浏览器走通：首页 → 列表 → 正文（含目录滚动、代码块）→ 标签 → 关于。
- 用草稿 slug 访问详情，确认 404；列表中不可见该篇。
- 无法用浏览器验证的部分：无。
