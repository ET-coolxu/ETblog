---
title: 正文页按 Quiet Editorial 稿改版式
type: optimization
status: done
created: 2026-09-28
updated: 2026-09-28
related:
  - D:/docs/blog/design/stitch_coolxu_blog_post_page/code.html
  - D:/docs/blog/design/stitch_coolxu_blog_post_page/DESIGN.md
  - docs/agent-prompts/archive/2026-09-16-post-toc-three-column.md
  - docs/requirements/v1.md
---

# 正文页按 Quiet Editorial 稿改版式

请按本提示词优化，不要顺手改产品边界。实现前先读 `.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc` 与 `app/(site)/posts/[slug]/page.tsx`、`components/table-of-contents.tsx`、`app/globals.css`。视觉对照 `D:/docs/blog/design/stitch_coolxu_blog_post_page/`。

## 背景

正文页仍是三列网格、目录在左、标题用半粗衬线。静态稿是安静的编辑排版：阅读栏约 760px，元信息与标签更轻，正文、标题、引用、列表、代码、表格、上下篇和右侧目录都换了一套节奏。顶栏与首页已按另一份稿改过，这次只动正文。

## 目标

- 阅读栏最宽 760px。标题、封面、正文、上一篇/下一篇同一条栏。
- 宽屏（`xl`）目录在阅读栏右侧，宽约 190px，sticky；当前节用松绿字色和短竖条。不挤进正文宽度。
- 窄于 `xl`：单列，目录仍用折叠 `<details>`。
- 无 h2/h3 时不渲染目录，阅读栏仍居中。
- 题头：日期与「N 分钟阅读」用标签字体与 muted；标题 Newsreader、字重 400（窄屏约 1.75rem，宽屏 2.5rem）；标签是浅底小芯片，仍链到标签页。
- 封面铺满阅读栏，`aspect-video`、圆角，不另限 18rem 高度。
- `.markdown`：正文 Inter、1.125rem、行距 1.95rem；h2/h3 为 Newsreader 字重 400；链接默认墨色、下划线用 rule，悬停变 pine；无序列表用圆点不用实心圆标；引用为浅底斜体衬线；代码块与表格用纸色分层；任务列表用方框。
- 上一篇/下一篇：小标签带箭头，悬停浅底，标题悬停变 pine。

## 非目标

- 不改顶栏、页脚、首页、列表、搜索、标签、关于页的外壳。关于页与后台预览共用 `.markdown`，会跟着正文排印走，但不改它们的标题布局。
- 不改目录提取、相邻文章、封面数据、PV、鉴权。
- 不引入 Material Symbols，不新造色板；颜色仍用 `paper` / `ink` / `muted` / `quiet` / `rule` / `pine` / `chip`。
- 不改 Shiki 主题。深色模式下代码块保留高亮自带背景，避免浅色字色叠在深底上读不清。
- 不改示例文章正文。

## 约束

- 文案中文。阅读分钟沿用 `readingMinutes`，展示为「N 分钟阅读」。
- 桌面目录只在 `xl` 出现。移动折叠与桌面侧栏不要打乱阅读栏顺序。
- 标题锚点不要被固定顶栏挡住（`scroll-margin`）。
- 目录仍是阅读页签名，不要用大面积 Hero 替代。

## 验收标准

- [x] 宽屏标题、封面、正文、上下篇左缘对齐，阅读栏约 760px
- [x] 宽屏目录在阅读栏右侧，当前节为松绿并带短竖条；滚动时高亮仍更新
- [x] 窄于 1280px 为单列，折叠目录可用
- [x] 无目录的文章阅读栏居中
- [x] 标签仍进入标签页；上下篇链接仍正确
- [x] 引用、列表、任务列表、代码块、表格、删除线在浅色下符合稿面层次
- [x] 顶栏与首页布局未被改动

## 涉及范围

- 文件/模块：`app/(site)/posts/[slug]/page.tsx`、`components/table-of-contents.tsx`、`app/globals.css`、`app/layout.tsx`（Newsreader 补细斜体）
- 度量方式：对照 `stitch_coolxu_blog_post_page/code.html`

## 实现要点

- 用「阅读栏 + 右侧 aside」替代三列网格。aside 拉高到与文章同高，内部 `sticky`，这样目录能跟着正文滑。
- 高亮状态只观察一次，折叠目录与侧栏共用。
- 相邻兄弟的段间距不要盖过 h2 的段前距。

## 验证

- `/posts/reading-markdown`（目录、引用、任务列表）与 `/posts/first-notes`（封面、代码、表格）。
- 宽屏 ≥1280、约 1100、手机宽。滚动看目录高亮；窄屏展开目录。
- 看首页顶栏，确认外壳没被改。
