---
title: 去掉 Tailwind，改成主题令牌与公共样式
type: architecture
status: in-progress
created: 2026-09-28
updated: 2026-09-29
related: []
---

# 去掉 Tailwind，改成主题令牌与公共样式

请按本提示词做架构更新。先读 `.cursor/rules/project-conventions.mdc`。外观保持现状，只换样式的写法和文件组织。

## 背景

颜色和深色模式已经在 `app/globals.css` 的 CSS 变量里。组件上是长串 Tailwind 工具类，以及 `text-[13px]`、`px-5` 这类任意值。文章列表、正文、关于、后台用的是同一套稿面，但没有可复用的公共类，样式只能堆在 `className` 上。

## 目标

- 去掉 Tailwind（`tailwindcss`、`@tailwindcss/postcss`、`postcss.config.mjs`、`@import "tailwindcss"`、`@theme`）。
- 全局主题令牌：颜色、字体栈、间距阶梯、字号阶梯、圆角。深色仍只覆盖颜色变量。
- 封闭的公共工具类：外边距 / 内边距 / 间隙、字号、字体，以及显示方式、弹性方向、对齐、换行、`grow` / `shrink-0`、`w-full`、`min-w-0`。
- `shared.css` 只放多页共用的骨架：栏宽、纵排横排、发丝线、链接、衬线大标题、图标尺寸。
- 只服务一个组件的外观（眉题、芯片、表单、说明文字）写在该组件的 `*.module.css`。登录和编辑器的输入框各自一份。
- 正文 `.markdown` 继续是全局类，规则放到 `app/styles/markdown.css`。

## 非目标

- 不改版式、不重做设计语言。
- 不引入 Sass、CSS-in-JS，不安装 Bootstrap、Pico、Open Props 或其他 CSS 框架。
- 不把工具类扩成颜色、断点、定位或任意宽高。
- 不改文章数据、鉴权、路由。
- 不改已归档提示词，不改 `docs/todo-v1.md` 里已勾掉的历史条目。

## 决策

| 决策 | 选择 | 不选 |
|---|---|---|
| 组件样式 | CSS Modules（`*.module.css`） | 全局类名互相覆盖、CSS-in-JS |
| 复用层 | 令牌 + 封闭工具类 + 语义公共类 | 再引入一套工具类框架 |
| 深色 | `.dark` 覆盖颜色变量 | 组件里再写一套深色选择器 |
| 断点 | 640 / 768 / 1280，编辑器双栏保留 1024 | 另造断点 |
| 字号 | 11px 为 `text-2xs`，13px 为 `text-xs`，14px 为 `text-sm`，15px 为 `text-md`，其余对齐原 Tailwind 的 `text-base` 到 `text-3xl` | 把现有 `text-sm`（14px）改成 15px |

## 约束

- 文章仍以 Markdown 文件为唯一信源。
- `shared.css` 只收多页共用的骨架（栏宽、排列、发丝线、链接、`.doc-title`、图标）。只被一个屏幕用的样式留在该组件的 `*.module.css`，相近的表单也不再抽成全局类。
- JSX 上的工具类只允许 `utilities.css` 里有的名字：间距、字号、字体，以及上面列出的布局类。禁止任意值（如 `text-[13px]`、`w-[13rem]`）。
- 组件特有的网格、定位、悬停放在该组件的 `*.module.css`。悬停写成父级 `:hover` 子级，不用 `group-hover`。
- 间距工具类档位只有 `0 1 2 3 4 5 6 8 10 12`（1 = 4px）。芯片内边距等半档写在组件样式里，用令牌 `--space-0-5` 等，不新增工具类。
- 字体栈必须是真正的全局变量。列表无衬线仍把网页字体写在雅黑前面。列表衬线标题保持 `font-optical-sizing: none`。
- 去掉 Tailwind 的 preflight 后，`base.css` 要补上本站依赖的重置（盒模型、标题、链接、按钮、图片），否则浏览器默认样式会改外观。

## 影响面

- 目录/模块：`app/styles/`、`app/globals.css`、带样式的 `components/` 与 `app/` 页面、`package.json`、`postcss.config.mjs`
- 数据流：无
- 部署：构建不再经过 Tailwind。依赖从 `package.json` 删除后，需在本机执行 `npm uninstall tailwindcss @tailwindcss/postcss` 更新锁文件
- 需要同步修改的规则或提示词：`.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc`、`docs/项目说明/01-阶段一-Next.js骨架.md`、`docs/项目说明/02-阶段二-公开阅读.md` 里对正文样式位置的说明

## 验收标准

- [ ] 公开站首页、文章列表、标签页、正文、关于、搜索，以及后台登录、文章列表、编辑器，布局与迁移前一致（含窄屏和深色）
- [x] 全文不再出现 `@import "tailwindcss"`、`@theme`、任意值类
- [x] 间距和字号来自 `app/styles/tokens.css`
- [x] `project-conventions.mdc` 与阶段一说明已改成新的样式结构

## 实现顺序

1. 令牌、基础重置、工具类、博客公共类、正文样式。`globals.css` 只负责按顺序引入。
2. 公开站组件与页面改为公共类加 `*.module.css`。
3. 后台页面与编辑器改用同一套令牌和公共类。
4. 删除 Tailwind 依赖与 `postcss.config.mjs`，更新约定和项目说明。
5. 在浏览器核对公开站与后台关键页。

## 验证

- 关键路径：首页、`/posts`、标签页、一篇正文、关于、搜索、后台登录后的列表和编辑页。
- 窄屏（目录折叠、列表封面变通栏）和深色模式各看一次。
- 不在代理里跑 `npm install` / `next build`。卸载命令交给维护者执行。
