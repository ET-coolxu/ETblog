---
title: 首页编辑式布局与右侧顶栏
type: optimization
status: done
created: 2026-09-24
updated: 2026-09-24
related:
  - D:/docs/blog/design/stitch-a-prime-handoff.md
---

# 首页编辑式布局与右侧顶栏

请按本提示词调整公开站首页与顶栏、页脚的版式。实现前先读 `.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc` 与现有 `components/site-header.tsx`、`components/site-nav.tsx`、`app/(site)/page.tsx`。视觉对照 `D:/docs/blog/design/stitch_coolxu_blog_minimal_homepage/`，规格以 `D:/docs/blog/design/stitch-a-prime-handoff.md` 的 A′ 为准。

## 背景

首页现在先放「笔记」眉题和站点简介，精选与最新共用同一种左边线卡片。顶栏里「搜索」是文字链接，和「文章 / 标签 / 关于」混在一组，「主题」也是文字。对照稿要把主导航收到右侧，紧贴搜索与主题。

## 目标

- 顶栏左：衬线站名，链到首页，站名来自 `getSiteConfig()`。本地 `.env.local` 的 `SITE_NAME` 应为 `"CoolXu's Blog"`，不要写成 `Blog`。
- 顶栏右：一组 `文章` / `标签` / `关于`；右侧细竖线后接搜索（图标，较宽时带「搜索」）和主题图标。当前页为松绿色加字重，不靠下划线。顶栏固定在顶部，半透明底加轻模糊，底边 1px 淡线。无头像。
- 首页去掉简介块。有精选时，第一篇为宽封面导语（无封面则不占图位）：日期、标签、阅读分钟、大衬线标题、摘要、「阅读全文」。其余精选为无大图列表，标题小于导语。
- 「最新」不含已在精选中的文章，最多 6 篇。窄日期列 + 标题与摘要。底部链到 `/posts`。
- 无已发布文章时中文空状态。无精选则只显示最新。
- 页脚保留作者与 RSS，不重复整套导航，不做访客头像。

## 非目标

- 不做文章正文、目录、后台、SEO 的改版。
- 色板仍走 `paper` / `ink` / `muted` / `rule` / `pine` 这组 token，色值对齐静态稿（暖纸色、松绿），不要在组件里散落 `gray-*`。
- 拉丁文用 Newsreader / Literata / Inter；中文回落到现有 Noto。不引入 Material Symbols，图标用内联 SVG。
- 分区可带静态稿上的英文小标（Curated Essays / Chronological）。不做头像、卡片阴影、杂志栅格，不造「深度长文」字段。
- 不改「最新最多 6 篇、精选与最新不重复」的数据规则。

## 约束

- 界面文案中文。阅读分钟用已有 `readingMinutes`，不新造「深度长文」之类字段。
- 搜索仍进入现有 `/search`，主题切换行为不变。
- 简介文案仍留给 metadata，只是首页不再渲染那一块。

## 验收标准

- [x] 顶栏右侧为「文章 标签 关于 | 搜索图标 主题图标」，无头像
- [x] 首页无「笔记」与简介段；精选首篇层级高于其后列表和「最新」
- [x] 无文章、无精选、精选与最新不重复，这三种情况文案正确
- [x] `/posts`、`/tags`、`/about`、`/search` 仍能从顶栏到达，当前项可辨认

## 涉及范围

- 文件/模块：`app/(site)/page.tsx`、`components/site-header.tsx`、`components/site-nav.tsx`、`components/theme-toggle.tsx`、`components/site-footer.tsx`、首页展示组件、`docs/requirements/v1.md` 首页描述
- 度量方式：对照 A′ 顶栏与首页结构，不对照色值逐项替换

## 实现要点

- 顶栏是「左站名 + 右一组」，不要把导航单独居中。
- 精选顺序沿用已发布列表的日期降序，第一篇做导语。

## 验证

- 看首页、文章列表、标签、关于、搜索的顶栏状态。
- 有封面与无封面的精选、零文章时的空状态。

2026-09-24 用户在本地确认首页与顶栏无问题。
