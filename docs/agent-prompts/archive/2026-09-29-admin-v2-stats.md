---
title: 后台 V2 统计
type: feature
status: done
created: 2026-09-29
updated: 2026-09-29
related:
  - docs/requirements/v2-admin.md
  - docs/agent-prompts/archive/2026-09-29-admin-v2-shell.md
  - docs/agent-prompts/archive/2026-09-29-admin-v2-overview.md
---

# 后台 V2 统计

请按本提示词实现。先读 `docs/requirements/v2-admin.md` 的「`/admin/stats`」、`lib/stats.ts`、`app/admin/(dashboard)/stats/page.tsx`。这是 V2 相对 v1 新增的统计展示；计入对象不要改。

## 背景

统计页现在是一行「总浏览」、已发布热门 Top 10（链到前台）、已发布文章表。原型是三格 KPI、热门排行、以及含状态的全部文章表。其中「今日浏览」当前库里没有日维度，不能用假数字充。

## 目标

- KPI：总浏览、已发布篇数、今日浏览。
- 今日浏览是 `Asia/Shanghai` 自然日的真实计数，在现有 `recordPostView` 成功写入时一并累加。
- 热门仍为已发布 Top 10，标题改链到 `/admin/posts/[slug]`。
- 「各篇文章」列出草稿、已发布、存档。草稿浏览为「—」。

## 非目标

- 不改变谁计入 PV：仍仅访客成功打开已发布正文；带管理员 session 不记；存档与草稿不记新 PV。
- 不回填上线前的今日数据。
- 不做图表、不做按文章拆开的今日、不做导出。
- 删文仍删除该 slug 的累计行；不把当日计数减回去。
- 热门不要缩成原型里示意的 3 条。

## 约束

- SQLite 仍在应用内 `data/stats.sqlite`。日累计用单独的表，例如 `daily_views(day TEXT PRIMARY KEY, views INTEGER NOT NULL)`，`day` 为上海时区 `YYYY-MM-DD`。不要改 `post_views` 的主键语义。
- 日界用固定时区 `Asia/Shanghai`，不要用服务器本地时区碰运气。
- `recordPostView` 失败时保持现在的行为：打日志，不抛给访客。
- 总浏览继续是 `post_views` 的合计，这样删文后总数会下降。今日浏览是事件计数，删文后当日数字可以仍大于「剩下文章今天的浏览」。
- 各篇文章的浏览规则与总览相同：草稿「—」，已发布与存档显示累计（0 显示 0）。排序：有数字的按浏览降序，相同则日期新的在前，草稿在最后。
- 热门链接不要再指向 `/posts/[slug]`。
- 页面 `noindex` 已由后台 layout 处理，不要单独对访客开放这份数据。

## 验收标准

- [x] 三格在无数据时为 0、0、0，而不是空白
- [x] 已发布篇数等于已发布文章数，不含草稿与存档
- [x] 访客打开一篇已发布正文后，总浏览 +1，今日浏览 +1；同一管理员 session 打开不加
- [x] 草稿与存档直链不加今日、也不加总浏览
- [x] 热门最多 10 篇，只有已发布，标题进入编辑页
- [x] 各篇文章含草稿与存档；草稿为「—」；标题进入编辑页
- [x] 无热门、无文章时有中文空状态，KPI 仍在
- [x] 说明文案写明只计访客打开的已发布正文，且无图表

## 涉及范围

- 文件/模块：`lib/stats.ts`（建表、`recordPostView`、`getTodayPageViews`、列出全部文章浏览的查询）；`app/admin/(dashboard)/stats/page.tsx`、`page.module.css`；若总览提示词已加「全部 slug 计数」函数，这里复用
- 不影响：前台正文记 PV 的调用条件（仍在现有入口，只扩展写入）

## 实现要点

- 日累计与 slug 累计放在同一次成功路径里。访客请求失败时两张表都不要写出一半却抛错；现有 try/catch 包住即可。
- 已发布篇数从文章列表数，不要从 `post_views` 行数数。
- 表与热门的标题悬停为 pine。

## 验证

- 浏览器打开统计页，看三格、热门、全表（含一篇草稿、一篇存档若有）。
- 无痕窗口打开一篇已发布正文，再回统计页看总浏览与今日是否 +1。登录状态下再打开同一篇，数字不应为这次 +1。
- 点热门与表内标题，应进后台编辑页。
- 无法在浏览器里伪造时区时，说明日界实现用的是 `Asia/Shanghai`，并指出代码位置。
