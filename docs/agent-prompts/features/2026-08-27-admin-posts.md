---
title: 后台文章编辑与图片上传
type: feature
status: ready
created: 2026-08-27
updated: 2026-08-27
related:
  - docs/requirements/v1.md
  - docs/agent-prompts/features/2026-08-27-public-reading.md
  - docs/agent-prompts/archive/2026-08-27-search-seo-stats.md
---

# 后台文章编辑与图片上传

请按本提示词实现，不要扩大范围。实现前先读 `.cursor/rules/project-conventions.mdc`、`docs/requirements/v1.md` 与相关现有代码。产品细节以 PRD 为准。

## 背景

公开站已能读 `content/` 中的 Markdown。需要浏览器里写稿、插图、发草稿/发布，发布后前台立刻可见。

## 目标

- 单管理员登录：`ADMIN_PASSWORD` + 可选 `ADMIN_USER`（默认 `admin`）+ httpOnly session。
- `/admin/login`、`/admin/logout`；未登录访问 `/admin/*`（除 login）重定向到登录页。
- `/admin`：全部文章含草稿，标明状态；入口「写文章」、统计。
- `/admin/posts/new`：创建时设定 slug；frontmatter + 正文；分栏预览；保存草稿 / 发布。
- `/admin/posts/[slug]`：编辑已有文章；slug 只读；无删除。
- 图片上传：拖拽或粘贴，写入 `public/uploads/{yyyy}/{mm}/`，插入 Markdown 图片语法。鉴权后才可上传。
- 保存后 `revalidatePath`，前台不整站重建即可看到已发布变更。
- 接通 `/admin/stats`（总 PV、分文 PV、热门 Top 10）。若上一切片已有统计写入，本切片补登录保护与展示。

## 非目标

- 删除文章、修改已有 slug、后台编辑关于页。
- 评论、订阅、多用户、独立分析服务。
- 改公开阅读的视觉体系（沿用现有 token）。

## 约束

- 遵守 Markdown 唯一信源、中文文案、第一版不做评论/订阅/多用户。
- 后台只写 `content/posts/{slug}.md`，不要再写数据库文章表。
- slug 仅 `[a-z0-9-]+`，创建后不可改；防路径穿越。
- 图片：png/jpg/jpeg/webp/gif，最大 5MB，禁止 svg；失败要有原因。
- 错误密码提示笼统，不泄露用户是否存在。
- 发布后 `revalidatePath`，不要靠整站重建发文。

## 验收标准

- [ ] 未登录访问 `/admin` 其他页会到登录页；错误密码有提示
- [ ] 可新建文章（此时设定 slug）、保存草稿、发布；可再编辑；发布后前台立刻可见
- [ ] 可上传允许类型图片并插入正文；超限或 svg 失败且有原因
- [ ] 无删除按钮；编辑页 slug 只读；无关于页编辑入口
- [ ] `/admin/stats` 需登录；展示总 PV、分文 PV、热门 Top 10
- [ ] 草稿对访客仍 404 且不出现在公开列表

## 涉及范围

- 文件/模块：`app/admin/`、`app/api/upload/`、`lib/auth.ts`、`lib/posts.ts` 的写入、session 中间件
- 不影响：搜索算法、Markdown 渲染管线（预览可复用）、Docker 拓扑

## 实现要点

- iron-session 或同等 httpOnly cookie session。
- 新建时校验 slug 唯一且格式合法；重名拒绝并提示。
- 预览与前台同一套 Markdown 管线，避免「后台一种样子、前台另一种」。
- 统计页只读，不在本切片改计数规则。

## 验证

- 浏览器：登录失败 → 登录成功 → 新建草稿 → 访客不可见 → 发布 → 访客可见且含图片 → 再编辑标题后前台更新。
- 尝试删除或改 slug：界面无这些能力。
- 无法用浏览器验证的部分：直接改磁盘上 md 后刷新后台列表应能看到（文件即信源）。
