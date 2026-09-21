---
title: 首页与顶栏视觉刷新（A′）
type: optimization
status: done
created: 2026-09-21
updated: 2026-09-21
related:
  - docs/requirements/v1.md
  - components/site-header.tsx
  - components/site-nav.tsx
  - components/site-footer.tsx
  - components/featured-post.tsx
  - app/(site)/page.tsx
---

# 首页与顶栏视觉刷新（A′）

请按本提示词优化，不要顺手改产品边界。实现前先读 `.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc` 与相关现有代码。

## 背景

coolxu.com 现首页在顶栏下先放「笔记」标签 + 站名 + 简介 hero，精选与最新都走左侧竖线 `PostCard`（封面 `max-h-40`）。顶栏把「文章 / 标签 / 关于 / 搜索 / 主题」摊成一排，没有把页面链接与搜索/主题分成两组。

已确认方案为设计 **A′**：C 式顶栏 + 首页去掉 intro hero，顶栏下直接是精选大图 + 标题摘要，再接纵向最新列表。对照线上 https://coolxu.com。

## 目标

- 顶栏 C 式：左侧品牌（`SITE_NAME`）；右侧一组「文章 / 标签 / 关于」，再一组「搜索 / 主题」。不要访客头像。页眉**不要** `sticky`。
- 首页去掉 intro hero（无「笔记」标签、无简介文案块）。简介仍留在站点配置，供 RSS / SEO / OG 使用。
- 顶栏正下方：精选已发布文章，全内容栏宽封面（有封面才渲染；圆角 6–8px；**无卡片阴影**）+ 标题 / 摘要。纵向堆叠，不用左文右图杂志分栏。
- 其下为纵向「最新」列表，最多 6 篇，不含已在精选中出现的。无精选则只显示最新。无内容中文空状态。
- 页脚只保留作者署名 + RSS。若有镜像五链导航则去掉（当前实现已符合则不要为改而改）。
- 次要文字继续用 `text-muted`（走 CSS token），保证暗色模式可读。不要改色板。

## 非目标

- 不改正文页布局、目录、SEO/性能专项、设计系统或色板。
- 不扩大 v1 明确不做项：评论、邮件订阅、多用户、改 slug、后台改关于页等。
- 不把文章列表 / 标签 / 搜索页的 `PostCard` 改成精选大图样式。
- 英文微标签、阅读时长是可选项，不得挡住主路径。
- 不把站名、作者写死为 `coolxu`；继续 `getSiteConfig()`。

## 约束

- 优化后行为与 `docs/requirements/v1.md`、项目约定一致（实现前已按 A′ 改 PRD 首页表述）。
- Markdown 仍是文章唯一信源；`featured` 仅已发布生效。
- 文案中文。颜色只用 `paper` / `ink` / `muted` / `rule` / `pine`。
- 精选封面用现有 `CoverImage`（原生 `img`、`no-referrer`），不要为此外链去配 `next/image`。
- 内容栏宽度仍与站内其它页一致（`max-w-3xl`），大图指栏宽而非视口通栏出血。
- 最小连贯改动：新增首页精选展示组件可以，不要重构后台或阅读页。

## 验收标准

- [x] 顶栏：左品牌、右「文章 / 标签 / 关于」+「搜索 / 主题」两组；无头像；滚动时页眉不吸顶
- [x] 首页无「笔记」标签与简介 hero；有精选时顶栏下先是大图（或无封面时的标题摘要）再是最新列表
- [x] 精选封面全栏宽、圆角 6–8px、无 box-shadow；不是左右分栏
- [x] 无精选时只显示最新；全空时中文空状态
- [x] 页脚仅作者 + RSS
- [x] 首页 → 正文、顶栏链接、搜索、主题切换无回归；暗色下次要文字仍可读
- [x] 功能 PR 对 `test` 打开，正文写明 A′ 改了哪些文件，并附真实 UI 截图（托管 artifact，不提交进分支）

## 涉及范围

- 文件/模块：`app/(site)/page.tsx`、`components/site-nav.tsx`、`components/site-header.tsx`（仅确认非 sticky）、`components/site-footer.tsx`（仅在仍镜像导航时改）、首页精选展示组件、`docs/requirements/v1.md`、本提示词
- 度量方式（可选）：对照线上首页结构；浏览器走通主路径

## 实现要点

- 精选与最新数据规则保持：`featured: true` 的已发布在上，其余最新最多 6 篇。
- 精选不要复用列表 `PostCard` 的细封面 + 左竖线卡片感。
- 搜索仍链到 `/search`，主题仍用现有 `ThemeToggle`。

## 验证

- 浅色 / 深色看首页、文章、标签、关于、搜索。
- 点精选与最新进正文，再经顶栏回来。
- 窄屏确认导航两组能折行、大图不溢出。
