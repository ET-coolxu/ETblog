---
title: 文章列表中文字体与行布局整理
type: optimization
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - docs/agent-prompts/archive/2026-09-28-posts-list-match-stitch.md
  - docs/agent-prompts/archive/2026-09-28-list-title-summary-font.md
  - D:/docs/blog/design/stitch_coolxu_blog_posts_list/code.html
  - D:/docs/blog/design/stitch_coolxu_blog_posts_list/quiet_editorial/DESIGN.md
---

# 文章列表中文字体与行布局整理

请按本提示词优化，不要顺手改产品边界。实现前先读 `.cursor/rules/project-conventions.mdc` 与相关现有代码。

## 背景

`/posts` 和标签筛选的中文看起来比 Stitch 稿硬、不圆。稿面标题是 Newsreader，中文回退 Noto Serif SC；正文、标签、摘要是 Inter，中文回退 Noto Sans SC。现在列表标题和摘要把微软雅黑写在网页字体前面，Windows 上中文停在雅黑。雅黑只有 400/700，字重 500 会落到常规，ClearType 又把笔画吸成方头。

`components/post-index.tsx` 用 `archive` / `tag` 两套三元类名叠在同一棵树上，封面渲染了两次，阅读时分不清哪一段属于哪一屏。`/posts` 与 `/tags/[tag]` 的纸色外壳也各写了一份。

## 目标

- 列表页题、条目标题：拉丁字母 Newsreader（光学尺寸停在默认正文切），中文用已加载的 Noto Serif SC，系统宋体只作再往后的回退。
- 列表里的摘要、分类芯片、标签 pill、返回链接、篇数、分页文案：拉丁字母 Inter，中文用已加载的 Noto Sans SC，微软雅黑只作再往后的回退。
- 索引行收成一张变体表：全部文章屏与标签屏各一组类名，封面只渲染一次。两页共用同一个纸色外壳。
- 行距、字号、颜色、封面尺寸、点击区域与现在一致。

## 非目标

- 不改顶栏、页脚、站名、导航的字体和样式。
- 不改正文页、首页、关于、搜索、后台。
- 不改 `--font-label` / `--font-serif` 的全站定义。
- 不补稿面里没有数据来源的副标题（「关于思考、设计与书写」、标签简介）。
- 不改左右内边距，以免和现有顶栏错位。

## 约束

- 字体类只挂在列表组件上。顶栏和页脚继续用 `font-label` / `font-serif`。
- 中文注释写在本次改动的字体栈和变体表旁，说明为什么网页字体排在系统字体前面。
- 点标签仍然只进标签页，点行的其余区域进正文。

## 验收标准

- [x] `/posts` 条目标题的中文计算字体是 Noto Serif SC，不是微软雅黑或宋体
- [x] `/posts` 摘要和分类芯片的中文计算字体是 Noto Sans SC，不是微软雅黑或 Literata
- [x] 顶栏导航和页脚的计算字体与改动前相同
- [x] 全部文章屏与标签筛选屏的间距、封面、分页位置没有变
- [x] 索引行不再按变体分叉两套 JSX

## 涉及范围

- `app/globals.css`
- `components/post-index.tsx`
- `components/pagination.tsx`
- `app/(site)/posts/page.tsx`
- `app/(site)/tags/[tag]/page.tsx`

## 实现要点

- 新增只供列表使用的 `.list-serif`、`.list-sans`。Noto 变量字体写在 PingFang / 雅黑 / 宋体之前。
- `.list-serif` 关闭 `font-optical-sizing`，避免 Newsreader 按 32px 换成更尖的展示切。
- 用变体表描述两屏差异，文章节点结构保持一条。

## 验证

- 打开 `/posts`，看页题、一条标题、摘要、一枚分类芯片的 `font-family`。
- 打开带标签的列表，确认行距和薄荷绿 pill 仍在。
- 看顶栏「文章」和页脚，确认字体没跟着变。
