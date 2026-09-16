---
title: 文章删除与存档
type: feature
status: in-progress
created: 2026-09-15
updated: 2026-09-16
related:
  - docs/requirements/v1.md
  - docs/todo-v1.md
  - docs/agent-prompts/archive/2026-08-27-admin-posts.md
---

# 文章删除与存档

请按本提示词实现，不要扩大范围。实现前先读 `.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc` 与 [docs/requirements/v1.md](../../requirements/v1.md) 第 5.1、7、8、10 节。产品细节以 PRD 为准。

## 背景

第一版只区分草稿 / 已发布，后台不能删文。站点已上线：需要把写错的示例或废稿真正删掉，也需要把已完成但不想再展示的文章撤出前台。草稿表示未写完；存档表示写完后撤出，二者不能做成同一个开关。

已确认（2026-09-15）：

1. 存档后访客不可读（直链 404，与草稿对外相同）。
2. 任意状态（草稿、已发布、已存档）都可以删除。
3. 删除后该 slug 可被新建流程再次分配；该 slug 的 PV 行删除；`public/uploads/` 图片不删。
4. 存档不能直接重新发布，必须先改为草稿再发布；已发布可以改为草稿。

## 目标

- 文章状态为三选一：**草稿 / 已发布 / 已存档**。frontmatter 用 `draft` 与 `archived` 两个布尔；写入时不得同时为 true。
- 公开侧（首页、列表、标签、搜索、RSS、sitemap、上一篇/下一篇、精选、记 PV）只认「非草稿且非存档」。
- 后台列表标明三种状态；编辑页按状态提供操作，**服务端必须校验流转**，不能只靠藏按钮。
- 删除：确认后删除 `content/posts/{slug}.md` 与 SQLite 中该 slug 的 PV；不碰上传目录；然后 `revalidatePath` 并回到 `/admin`。

## 非目标

- 回收站、软删除、撤销删除。
- 级联删除封面或正文里的 `/uploads/` 文件。
- 修改已有 slug；指定完整旧 slug 的「回收」入口。
- 草稿存档（草稿已对访客不可见，无存档按钮）。
- 已存档直接发布。
- 评论、多用户、后台编辑关于页。
- 改部署 / Docker / CI。

## 约束

- Markdown 仍是唯一信源；不要把状态另存数据库。PV 仍只在 SQLite。
- 文案中文。颜色用 `paper` / `ink` / `muted` / `rule` / `pine`。
- 鉴权：删除、存档、改状态走已有管理员 session 校验（与 `savePost` 相同层级）。读写 slug 继续防路径穿越。
- `listPublishedPosts` / `getPublishedPost` / `listPublishedPostContents` 必须排除存档，这样搜索、RSS、sitemap、统计热门会跟着对。
- 新建仍走 `allocateCreateSlug`：序号取**现存**文件名尾部数字 max+1。不建已删 slug 黑名单。创建后 slug 只读。
- 写入后 `revalidatePath`（含首页、列表、该文、标签、搜索、feed、sitemap、后台）。删除后还要刷新该文旧路径，避免缓存里仍是 200。
- 导出函数、状态流转、删除与防穿越补中文 JSDoc。不要整文件无注释。
- 不要运行 `npm install`、`next build`、docker。短只读命令可以跑。不要 git commit / push。

## 验收标准

- [ ] 已发布点「存档」（确认后）：frontmatter `archived: true` 且无 `draft`；访客列表/搜索/RSS/sitemap 没有该文；直链 404；后台显示已存档
- [ ] 已存档编辑页没有「发布」；点「发布」的伪造请求被拒绝并提示须先改为草稿
- [ ] 已存档「改为草稿」后：`draft: true`、无 `archived`；访客仍 404；随后可发布，发布后前台可见
- [ ] 已发布「改为草稿」或「保存草稿」后：访客 404，后台为草稿；可再发布
- [ ] 草稿编辑页无「存档」；伪造存档请求被拒绝
- [ ] 草稿 / 已发布 / 已存档均可删除；确认文案说明不可恢复、会删 PV、不删图片
- [ ] 删除后 Markdown 文件不在；该 slug 的 `post_views` 行不在；`public/uploads/` 未因本次删除少文件
- [ ] 删除当前最大序号的文章后，下一篇新建分配到的数字可以再次用到该序号；不存在「已删 slug 永久占用」
- [ ] 后台列表三种状态文案正确；无文章仍有中文空状态
- [ ] 存档文的 `featured` 不出现在首页精选
- [ ] 管理员打开存档或草稿正文不记 PV；删除后统计总 PV 不再含该 slug

## 涉及范围

- 文件/模块：`lib/posts.ts`（读盘过滤、`AdminPost`、`savePost` 状态、新增 `deletePost`）、`lib/stats.ts`（按 slug 删 PV 行）、`app/admin/(dashboard)/posts/actions.ts`、`components/post-editor.tsx`、`app/admin/(dashboard)/page.tsx`、编辑页传入当前状态
- 公开页一般不必各改一遍，只要发表接口排除存档
- 不影响：上传接口、关于页、鉴权 cookie、部署配置

## 实现要点

### 状态

- `AdminPost` 增加 `archived: boolean`。
- 公开：`!draft && !archived`。读盘时若两字段都为 true，对外当存档，后台显示已存档。
- `savePost` 按意图写入：**发布** → 两者都不写（或 false）；**草稿** → 只 `draft: true`；**存档** → 只 `archived: true`。禁止一次写入两个 true。
- 更新时校验当前磁盘状态：
  - 已存档 + 意图发布 → 错误：「请先改为草稿再发布。」
  - 草稿 + 意图存档 → 错误：「草稿不能存档。」
  - 已存档 + 意图存档 → 允许（保存正文，仍为存档）。
  - 已发布 + 意图存档 / 改为草稿 / 保存发布 → 允许。

### 删除

- `deletePost(slug)`：解析路径、确认文件在 `content/posts/` 内、`unlink`；找不到则返回中文错误。
- `deletePostViews(slug)`：`DELETE FROM post_views WHERE slug = ?`。文件已删、PV 行本就不存在时仍算成功。
- 删除失败不要留下「文件没了但 PV 还在」或反过来而不提示；顺序建议先删文件再删 PV（文件是信源）；若 PV 删除失败打日志，仍把文章视为已删。
- Server Action 删除成功后 `revalidatePath` 并 `redirect("/admin")`。

### 后台 UI

- 列表：草稿 / 已发布 / 已存档。
- 编辑器 `intent`：`draft` | `publish` | `archive` | `delete`（删除也可独立 action）。已发布「改为草稿」走 `draft`。
- 存档、删除：浏览器确认框即可，文案中文写清后果。
- 新建页保持保存草稿 / 发布，不出现存档和删除。

### slug 与序号

- 继续用现存文件扫描 max+1。删除即释放文件名。不要为已删 slug 建表。

## 验证

- 在浏览器走通：发布 → 存档 → 访客 404 → 改为草稿 → 再发布可见；已发布改为草稿 → 再发布；三种状态各删一篇（可用临时文，不要误删要留的正文）。
- 删除后确认 uploads 目录文件仍在；用统计页或读 SQLite 确认该 slug PV 已没。
- 无法用浏览器验证的部分：伪造已存档「发布」、草稿「存档」的请求（可用 Server Action 校验的单测思路，或实现时写清已在 action 分支拒绝）。
- 改完把本文件 `status` 改为 `done` 并移入 `docs/agent-prompts/archive/`；勾选 `docs/todo-v1.md` 对应项。
