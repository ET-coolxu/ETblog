---
title: 后台 V2 侧栏壳
type: architecture
status: done
created: 2026-09-29
updated: 2026-09-29
related:
  - docs/requirements/v2-admin.md
  - docs/agent-prompts/archive/2026-09-29-admin-v2-login.md
  - docs/agent-prompts/archive/2026-09-29-admin-v2-overview.md
  - docs/agent-prompts/archive/2026-09-29-admin-v2-editor.md
  - docs/agent-prompts/archive/2026-09-29-admin-v2-stats.md
---

# 后台 V2 侧栏壳

请按本提示词做架构更新。先读 `docs/requirements/v2-admin.md` 的「壳」一节、`.cursor/rules/project-conventions.mdc` 与 `.cursor/rules/nextjs-app.mdc`，再改代码。本篇只做登录后的框，不改各页内容。

## 背景

登录后的后台现在是顶栏（`components/admin-header.tsx`）：站名、文章 / 写文章 / 统计、前台、主题、登出。这和访客顶栏太接近。V2 改成左固定侧栏，主区自己滚动。

## 目标

- `/admin`、`/admin/posts/new`、`/admin/posts/[slug]`、`/admin/stats` 共用左栏壳。
- 导航、前台、主题、登出从顶栏挪进侧栏，能力保持：主题仍是现有浅色/深色切换，登出仍清 session。
- 主区可独立滚动；编辑器页能铺满剩余高度（具体写作面由编辑器提示词做）。
- 窄于 768px 时侧栏改为顶部紧凑条。

## 非目标

- 不改登录页版式（见登录提示词）。
- 不改文章列表、编辑器字段、统计数字。
- 不改鉴权：`requireAdminSession` 仍在 dashboard layout，HMAC 不进侧栏。
- 不加搜索、头像、访客式顶栏。

## 决策

| 决策 | 选择 | 不选 |
|---|---|---|
| 登录后导航 | 左栏约 220px | 继续顶栏 |
| 选中「写文章」 | `/admin/posts/new` 与 `/admin/posts/[slug]` | 只有新建页算选中 |
| 前台 | `/` 新标签，`rel="noopener noreferrer"` | 当前标签覆盖后台 |
| 主题 | 复用 `next-themes`，按钮含「主题」 | 另一套主题或仅图标 |
| 颜色字体 | `tokens.css` 与现有字体 | 原型里的另一套 hex、Source Sans 3 |
| 窄屏 | &lt;768px 顶部紧凑条 | 桌面侧栏硬挤 |

## 约束

- 文章仍以 Markdown 为唯一信源。
- 站名来自 `getSiteConfig()`，不要写死 CoolXu。
- 样式用 CSS Modules 和令牌变量。禁止把原型的 Tailwind 类抄进 JSX。
- 侧栏可以是客户端组件（当前路径、主题、登出）。不要在侧栏里读密钥或直接查库。
- 图标用内联 SVG，约 16px，`currentColor`，不要新图标库。
- 删除按钮若本篇就加危险色，把 `--danger` 放进 `tokens.css`（浅色 `#9b3b3b`，深色要在深纸色上可读）。编辑器提示词会用它。

## 影响面

- 目录/模块：`app/admin/(dashboard)/layout.tsx`、`layout.module.css`；用新的侧栏组件替换 `components/admin-header.tsx`（旧顶栏不再引用则可删）。
- 数据流：无。
- 部署：无。
- 需要同步修改的规则或提示词：无。产品说明已在 `docs/requirements/v2-admin.md`。若 `project-conventions.mdc` 仍只写 v1，补一句后台工作台以该文件为准。

## 验收标准

- [x] 登录后四类页面都是左栏，不是顶栏
- [x] 文章 / 写文章 / 统计的选中规则与 v2 文档一致，编辑已有文章时「写文章」为选中
- [x] 前台新标签打开首页；主题能在浅色与深色间切换并保持；登出后到登录页且再进 `/admin` 会被拦回登录
- [x] 主区滚动时侧栏不动
- [x] 宽度 &lt;768px 时不再固定占 220px 侧栏
- [x] 深色下结构相同，颜色来自 `.dark` 令牌

## 实现顺序

1. 侧栏组件与 dashboard layout。
2. 去掉顶栏引用。
3. 窄屏与深色看一遍壳，先不要改列表和编辑器内部。

## 验证

- 浏览器：登录后点文章、写文章、打开一篇编辑、统计、前台、主题、登出。
- 把窗口收到 768px 以下，确认导航还在且主区可读。
- 未登录直接打开 `/admin` 仍到登录页。
