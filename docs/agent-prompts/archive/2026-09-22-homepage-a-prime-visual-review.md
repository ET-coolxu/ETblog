---
title: A′ 视觉复审：栏宽、小节标题、窄屏顶栏、列表封面
type: fix
status: done
created: 2026-09-22
updated: 2026-09-22
related:
  - docs/agent-prompts/archive/2026-09-21-homepage-nav-refresh-a-prime.md
  - docs/requirements/v1.md
  - app/(site)/page.tsx
  - components/site-header.tsx
  - components/site-nav.tsx
  - components/post-card.tsx
---

# A′ 视觉复审：栏宽、小节标题、窄屏顶栏、列表封面

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc` 与相关现有代码。同一功能分支继续改 PR #4，不要新开 PR、不要合并。

## 背景

PR #4 已按 A′ 去掉 intro hero、精选改大图、顶栏分两组。产品与设计复审要求四条修正：

1. 桌面内容栏偏窄，希望大约 720–800px，仍保持可读行长与 A′ 对齐（顶栏 / 首页 / 页脚同一栏宽）。
2. 精选块缺少可见中文小节标题；「最新」已有，「精选」目前是 `sr-only`。
3. 约 400px 视口：品牌名折行；搜索/主题组的竖线折到下一行后像悬浮分隔条。
4. 最新列表若出现封面，全宽 `max-h-40` 会和精选大图抢视线。

## 复现步骤

1. 桌面打开首页，量内容栏（含左右 padding 的栏盒）是否明显小于约 720px。
2. 看精选区上方有没有可见的「精选」。
3. 视口拉到约 400px：品牌是否折成两行；竖线是否单独落在下一行。
4. 最新列表有封面时，图是否接近精选大图的体量。

## 目标

- 前台共用内容栏（顶栏、首页、页脚，以及文章列表 / 标签 / 关于 / 搜索 / 404）加宽到约 720–800px。用一处 token / 工具类，不要各页各写一个魔法数。
- 正文阅读栏保持现有约 48rem 三列布局，不要借这次去改目录网格。
- 精选、最新都用可见中文小节标题（`精选` / `最新`），样式与现有「最新」一致。
- 400px：品牌 `whitespace-nowrap`，不折行；竖线只在两组能并排时出现（`sm+`），窄屏只用间距分组。品牌仍在左，导航/工具尽量在右。
- 首页最新列表封面改小、更克制（缩略图级），保留可扫读；精选大图不变。

## 非目标

- 不新开 PR、不合入 `test` / `main`。
- 不改正文页三列、色板、v1 排除项。
- 不把列表卡改成杂志分栏或精选大图。

## 约束

- 站名、作者继续走 `getSiteConfig()`，不写死。
- 颜色只用 `paper` / `ink` / `muted` / `rule` / `pine`。
- 截图与证明不进 git；更新现有 PR #4 正文。
- 最小改动：列表封面用 `PostCard` 可选参数，只在首页最新开启即可。

## 验收标准

- [x] 桌面内容栏约 720–800px；顶栏、首页、页脚对齐
- [x] 可见「精选」「最新」中文标题
- [x] 400px 品牌不折行；竖线不单独悬浮
- [x] 最新列表封面明显小于精选大图
- [x] 浅色 / 深色与首页 → 正文、顶栏、搜索、主题无回归
- [x] PR #4 已更新；桌面浅色与 400px 新截图以托管 artifact 引用，不进分支

## 涉及范围

- 文件/模块：`app/globals.css`（栏宽 token）、`components/site-header.tsx`、`components/site-nav.tsx`、`components/site-footer.tsx`、`app/(site)/page.tsx`、其它前台 `max-w-3xl` 列表页、`components/post-card.tsx`

## 实现要点

- Tailwind v4 `@theme` 增加约 `50rem` 的站点栏宽（例如 `--container-site` → `max-w-site`）。
- 窄屏顶栏收紧 gap / 字号；`border-l` 提到 `sm:`。
- `PostCard` 增加 compact 封面：小圆角缩略图，不要全栏宽。

## 验证

- 浅色 / 深色桌面首页；400px 顶栏；点精选与最新进正文；文章 / 标签 / 关于 / 搜索 / 主题。
- 产出桌面浅色、400px 新截图，路径写进回复与 PR，供宿主拷到附件目录。
