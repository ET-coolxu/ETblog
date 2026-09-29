---
title: 后台 V2 文章总览
type: feature
status: ready
created: 2026-09-29
updated: 2026-09-29
related:
  - docs/requirements/v2-admin.md
  - docs/agent-prompts/architecture/2026-09-29-admin-v2-shell.md
---

# 后台 V2 文章总览

请按本提示词实现。先读 `docs/requirements/v2-admin.md` 的「`/admin` 文章总览」、`.cursor/rules/project-conventions.mdc`，以及 `app/admin/(dashboard)/page.tsx`、`lib/posts.ts`、`lib/stats.ts`。壳应已是侧栏；若仍是顶栏，先做壳提示词。

## 背景

`/admin` 现在是稀疏列表：标题、日期和 slug 一行、状态文字，旁边还有「统计」链接。没有筛选，也不显示浏览。V2 改成管理表，并加上状态筛选和浏览列。

## 目标

- 标题「文章」+ 当前筛选篇数；右上只有「写文章」。
- chips：全部 | 已发布 | 草稿 | 存档，对应查询参数 `status`。
- 表列：标题、日期、slug、状态、浏览。标题进入编辑页。
- 草稿浏览为「—」；已发布与存档为累计 PV。
- 空列表与空筛选都有中文空状态。

## 非目标

- 不在本页删除、存档或改状态。
- 不加搜索、分页、多选、批量。
- 不改文章文件格式，不改 PV 写入规则。
- 不把「统计」再放回本页工具区。

## 约束

- 列表仍读 Markdown。草稿与存档继续出现在「全部」里。
- `status` 只接受 `published`、`draft`、`archived`。其它值按全部。
- 浏览数一次查询全部 slug 的计数再在内存里拼上，禁止每行 `getPostPageViews`。
- 状态给访客的可见性不变。本页只是管理员筛选。
- 文案：已发布、草稿、存档。样式用令牌：已发布软 pine 底，草稿中性，存档更淡。
- 日期格式沿用 `formatPostDate`。

## 验收标准

- [ ] 默认「全部」，篇数等于全部文章数；点已发布 / 草稿 / 存档后表和篇数只剩该状态，地址栏带 `status`
- [ ] 刷新或复制该 URL，筛选仍在
- [ ] 非法 `status` 显示全部，不 500
- [ ] 草稿行浏览为「—」；已发布与存档为数字，含 0
- [ ] 无文章、以及某状态筛空，都有中文说明，不是空白
- [ ] 行内没有删除；标题链到 `/admin/posts/[slug]`
- [ ] 本页没有「统计」按钮

## 涉及范围

- 文件/模块：`app/admin/(dashboard)/page.tsx`、`page.module.css`；`lib/stats.ts` 增加一次取出全部 slug→views 的只读函数（若已有等价查询则复用）
- 不影响：编辑器、前台列表、PV 写入

## 实现要点

- 页面保持 Server Component。chips 用 `Link`，不要为筛选单独做客户端状态。
- 表在窄屏可横向滚动，列不要折成访客那种卡片列表。
- 标题悬停为 pine，不用默认链接蓝。

## 验证

- 浏览器：准备至少一篇已发布、一篇草稿、一篇存档。走全部与三个筛选、刷新、点进编辑再返回（筛选应还在，若返回丢失则改成筛选写在 URL 上——本提示词要求 URL）。
- 看草稿是否为「—」，已发布数字是否与统计页该文累计一致。
