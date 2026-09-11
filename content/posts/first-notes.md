---
title: 先把笔记写下来
date: '2026-08-26'
tags:
  - 笔记
  - Markdown
summary: 公开之前，先有一份能长期改的底稿。这是首页精选示例。
cover: /uploads/2026/08/cover-notes.svg
featured: true
---

这是站点的示例正文，用来验收阅读页：目录、代码高亮、表格和图片路径。

## 为什么从文件开始

文章存在 `content/posts/` 里，文件名就是 slug。后台以后只是这些文件的编辑器，不会再存一份数据库副本。

### 阅读时看什么

目录取自二级、三级标题。桌面在左侧跟着滚动，手机上先折叠起来。

## 一段代码

写笔记时偶尔要贴代码。下面用 TypeScript 做验收：

```ts
function readingMinutes(chars: number): number {
  return Math.max(1, Math.round(chars / 300));
}
```

语言标注要准确，高亮才靠得住。

## 一张小表

| 字段 | 作用 |
| --- | --- |
| `draft` | 为 true 时访客看不到 |
| `featured` | 首页优先展示 |
| `summary` | 列表和分享用 |

正文里的图写成 `![说明](/uploads/...)`，文件放在 `public/uploads/` 下。

## 功能测试
测试文章编辑功能
