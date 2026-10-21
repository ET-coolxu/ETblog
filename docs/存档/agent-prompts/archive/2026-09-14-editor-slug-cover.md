---
title: 编辑器 slug 序号、封面与插图 alt
type: feature
status: done
created: 2026-09-14
updated: 2026-09-14
related:
  - docs/requirements/v1.md
  - docs/agent-prompts/archive/2026-08-27-admin-posts.md
---

# 编辑器 slug 序号、封面与插图 alt

请按本提示词实现，不要扩大范围。实现前先读 `.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc`、`docs/requirements/v1.md` 与相关现有代码。产品细节以 PRD 为准。

## 背景

后台已能手填 slug、手填封面路径、上传图片插入正文。三处体验需要分开改：

- slug 容易撞名，但不该改成纯数字网址，也不该按前缀试探 `notes` / `notes-2`。
- 封面只能手填站内路径，`asCover` 会丢掉任何含 `://` 的值。
- 正文插图的 alt 用了原始文件名（如 `分组 1@2x (3)`），读者和读屏看到的是这份说明，不是磁盘名。

## 目标

- 新建页仍手填 `[a-z0-9-]+`，`new` 禁用。每一篇**第一次保存**把全站下一个序号接到后面，得到 `{手填}-{n}`。
- 序号从现有 `content/posts/*.md` 文件名尾部 `-{数字}` 取最大值 + 1；没有则从 1 起。不另建 ID 表。
- 保存后 `redirect` 到最终 slug；编辑页只读显示真实文件名。编辑已有文章不重新编号、不改 slug。
- 封面旁加和正文相同的「选择图片」，走现有 `/api/upload`，把返回的 `/uploads/...` 写入封面框（不插入正文）。手填路径仍保留。
- `asCover` 接受站内 `/...`（仍拒绝 `//`）或 `https://`；拒绝 `http://`、`javascript:`、`data:`。文案写明「外链图依赖对方站点」。
- 正文插入时 alt 用占位「图片」，光标停在 alt 里方便改写。磁盘 / URL 命名保持时间戳清洗，不改。

## 非目标

- 不改已有文章文件名，不开放改 slug，不删除文章。
- 不按前缀试探空闲名，不从标题生成 slug，不把 slug 改成纯数字。
- 不另建文章 ID 表，不把封面另存一份数据库。
- 不改磁盘上传命名规则；不把封面图改成 `next/image` 远程域名配置。
- 评论、订阅、多用户、后台编辑关于页。

## 约束

- 遵守 Markdown 唯一信源、中文文案、第一版不做评论/订阅/多用户。
- 后台只写 `content/posts/{slug}.md`。
- slug 仅 `[a-z0-9-]+`，创建后不可改；读写防路径穿越。
- 图片：png/jpg/jpeg/webp/gif，最大 5MB，禁止 svg。
- 新增导出函数写中文 JSDoc。
- 不要 `git commit` / `git push`；不要跑 `npm install` / `next build` / docker。

## 验收标准

- [x] 填 `notes` 首次保存，库里还没有带序号的新文 → 文件为 `notes-1`，并跳到 `/admin/posts/notes-1`
- [x] 再新建填 `hello` → `hello-2`（序号全站递增，不按前缀重开）
- [x] 旧文（如 `first-notes`、无尾部序号）不动、不占用序号
- [x] 编辑已有文章保存后文件名不变
- [x] 封面可选图上传，输入框得到 `/uploads/...`，正文不被插入
- [x] 封面手填 `https://` 能写入 frontmatter；`http://`、`//`、`javascript:`、`data:` 被拒绝
- [x] 正文「选择图片」插入 `![图片](/uploads/...)`，选中或光标在「图片」上，不用原始文件名当 alt
- [x] 无删除按钮；编辑页 slug 只读；无关于页编辑入口

## 涉及范围

- 文件/模块：`lib/posts.ts`（`asCover`、新建分配 slug）、`app/admin/(dashboard)/posts/actions.ts`、`components/post-editor.tsx`；文档已按 PRD 更新。
- 不影响：上传磁盘命名、公开页 `<img src={post.cover}>`、OG `metadataBase`、已有 `content/posts/*.md` 文件名。

## 实现要点

- 扫描文件名而不是解析正文；只认尾部 `-{digits}`。若 `{手填}-{n}` 恰好已存在，继续加一，不要改成按前缀试探。
- `savePost(..., "create")` 返回最终 slug，供 `createPostAction` `revalidatePath` 与 `redirect`。
- `savePost(..., "update")` 使用已有 slug，不调用分配函数。
- 封面上传复用 `/api/upload`，与正文上传共用校验，只是写入目标不同。
- 作者填了封面但校验失败时，保存应报错，不要静默丢掉。

## 验证

- 在浏览器走通：登录 → 新建（看最终 slug）→ 再新建确认序号 +1 → 编辑旧文文件名不变 → 封面上传与 https → 正文插图 alt 为「图片」。
- 列出无法用浏览器验证的部分（拒绝 `javascript:` / `data:` 等可在保存时报错确认）。
