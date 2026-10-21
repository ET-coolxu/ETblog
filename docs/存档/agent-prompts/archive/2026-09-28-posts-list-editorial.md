---
title: 文章列表与标签筛选按 Quiet Editorial 改版式
type: optimization
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - D:/docs/blog/design/posts-list-handoff.md
  - D:/docs/blog/design/stitch_coolxu_blog_posts_list/code.html
  - D:/docs/blog/design/stitch_coolxu_blog_posts_list/markdown/code.html
  - docs/requirements/v1.md
---

# 文章列表与标签筛选按 Quiet Editorial 改版式

请按本提示词优化，不要顺手改产品边界。实现前先读 `.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc`，以及 `app/(site)/posts/page.tsx`、`app/(site)/tags/[tag]/page.tsx`、`components/post-card.tsx`、`components/pagination.tsx`。视觉以 `D:/docs/blog/design/posts-list-handoff.md` 为准，气质对照 `stitch_coolxu_blog_posts_list/`。

## 背景

`/posts` 与 `/tags/[tag]` 仍是左竖线大卡片：封面通栏、标签在摘要下面。新稿是安静的索引：衬线页题，日期与标签 pill 在标题前，摘要在下，有封面时右侧只放一张小图。筛选态页题为「标签：{名}」，并有返回全部文章的链接。顶栏、页脚、首页已经按另一份稿改过。

## 目标

- `/posts` 与 `/posts?tag=`、`/tags/[tag]` 共用同一套索引行。
- 内容柱与首页同宽同留白（`max-w-3xl`，`px-5 py-12 md:px-4`）。
- 默认列表页题为衬线「文章」，字重 400。不放 ARCHIVE 计数，不放副文案。
- 索引行顺序：日期 · 标签 pill → 衬线标题 → 摘要（最多两行）。有封面时右侧约 104×72、圆角 6px、细边、无阴影；无封面不留空位。悬停标题变为松绿。整行进入正文；标签仍单独链到 `/tags/[tag]`。
- 筛选态：返回链接「查看全部文章」，页题「标签：{名}」，旁注「包含此标签的文章共 N 篇」。当前标签的 pill 略强调。文档标题与页题一致。
- 空状态仍用中文，不要空白页。
- `/posts` 分页仍为每页 10 篇。多于一页时底栏为「上一页 / 页码 / 下一页」，不可点的一侧用 quiet 色。只有一页时不渲染分页。

## 非目标

- 不实现稿面顶部「分类」chip 条。
- 不改标签总览 `/tags`、搜索、正文、首页、后台、顶栏、页脚。
- 不给 `/tags/[tag]` 新加分页；该页仍列出该标签全部已发布文章。
- 不新增字体。日期继续用 `formatPostDate`（年月日）和标签字体，不用等宽 ISO 日期。
- 不写标签简介段落（稿面那句说明没有数据来源）。
- 不改筛选、排序、草稿可见性和 `tagHref`。

## 约束

- 文案中文。颜色只用现有 token：`paper` / `ink` / `muted` / `quiet` / `rule` / `pine` / `chip` / `tag-bg` / `tag`。
- 搜索仍用现有 `PostCard`。新索引不要改 `PostCard` 的外观。
- 封面继续走 `CoverImage`（原生 img）。
- 标签链接必须盖在整行点击层之上，避免点标签却进入正文。

## 验收标准

- [x] `/posts` 为索引行：有封面的在右侧小图，无封面的纯文字，行高不靠通栏图撑开
- [x] `/posts?tag=` 与 `/tags/[tag]` 页题为「标签：{名}」，有「查看全部文章」，列表结构与默认列表相同
- [x] 点标题、摘要或封面进入正文；点标签进入该标签页
- [x] 无文章、无该标签文章时有中文空状态
- [x] 分页仍每页 10 篇，且带上当前 `tag`；只有一页时不出现分页
- [x] `/tags` 总览、搜索、首页、顶栏未被改动

## 涉及范围

- 文件/模块：`components/post-index.tsx`（新）、`app/(site)/posts/page.tsx`、`app/(site)/tags/[tag]/page.tsx`、`components/pagination.tsx`
- 度量方式：对照 `stitch_coolxu_blog_posts_list/code.html` 与 `markdown/code.html`，范围以交接说明为准

## 实现要点

- 索引行用拉伸链接覆盖整行，标签链接 `relative z-10`。
- 筛选页头抽成共用组件，两处路由不要各写一套标题。

## 验证

- `/posts`：有封面与无封面混排。
- `/posts?tag=Markdown` 与 `/tags/Markdown`：筛选头与列表。
- `/posts?tag=不存在的标签`：空状态。
- 窄屏确认小图仍在右侧，不变成通栏。
- 看一眼 `/tags` 与 `/search`，确认没被带上新索引。
