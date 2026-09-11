---
title: 补齐 Cursor 基础规则与实现约定
type: architecture
status: done
created: 2026-09-11
updated: 2026-09-11
related:
  - .cursor/rules/main.mdc
  - .cursor/rules/project-conventions.mdc
  - .cursor/rules/nextjs-app.mdc
  - docs/requirements/v1.md
  - docs/项目说明/README.md
---

# 补齐 Cursor 基础规则与实现约定

请按本提示词做架构更新。先更新文档与约定，再改代码。实现前先读 `.cursor/rules/project-conventions.mdc`。

## 背景

现有 Cursor 规则覆盖了「先问清 / Git / 命令」「产品与技术栈」「提示词先行」，但：

- 实现代码几乎没有注释，函数、工具、安全与解析逻辑无法阅读。
- `docs/项目说明/` 里反复强调的 App Router 写法（默认 Server Component、`"use client"` 边界、目录职责、鉴权两层、设计 token）没有落成规则，Agent 容易写出和仓库不一致的代码。
- PRD 里若干易漏约束（空状态、上传限制、PV 不计管理员、标题模板）只写在需求文档，`project-conventions.mdc` 未收录。

## 目标

- 更新 `.cursor/rules/main.mdc`：增加中文注释规范（导出函数 / 工具 / 重要逻辑）。
- 新增 `.cursor/rules/nextjs-app.mdc`：把项目说明里的 Next.js 写法收成短规则。
- 补充 `project-conventions.mdc` 中实现时易漏的产品约束。
- 不改业务代码；不为整个仓库补注释（那是后续单独任务）。

## 非目标

- 不给 `lib/`、`app/`、`components/` 批量补注释。
- 不引入 ESLint 注释检查、不改 Prettier。
- 不把 Vercel 70 条性能规则整份搬进仓库。
- 不新增评论、多用户等第一版明确不做的能力。

## 决策

| 决策 | 选择 | 不选 |
|---|---|---|
| 注释语言 | 中文 | 英文或中英混写 |
| 注释写在哪 | `main.mdc`（基础规则，alwaysApply） | 只写在聊天里；或另开重复的注释规则 |
| App Router 写法 | 独立 `nextjs-app.mdc` | 塞进已经很长的 `project-conventions.mdc` |
| 已有代码 | 只订规则，不回填 | 本次给全仓库补注释 |

## 约束

- 文章仍以 Markdown 文件为唯一信源，除非本表明确推翻并同步改 `project-conventions.mdc`。
- 规则保持可执行、尽量短；一条规则一件事。
- 注释要求「为什么 / 约束」，禁止复述函数名。

## 影响面

- 目录/模块：仅 `.cursor/rules/`、`AGENTS.md` 与本提示词
- 数据流：无
- 部署：无
- 需要同步修改的规则或提示词：`main.mdc`、`project-conventions.mdc`、新增 `nextjs-app.mdc`

## 验收标准

- [x] `main.mdc` 含中文注释规范，并有正反例或等价示例
- [x] `nextjs-app.mdc` 覆盖：默认 RSC、`"use client"` 边界、`app`/`components`/`lib`、公开站与后台 layout、站内 Link、鉴权两层、设计 token
- [x] `project-conventions.mdc` 补上：空状态、上传限制、PV 规则、标题模板
- [x] 未改业务代码

## 实现顺序

1. 写本提示词并开始改规则。
2. 更新 `main.mdc`。
3. 新增 `nextjs-app.mdc`。
4. 补充 `project-conventions.mdc`。
5. 本提示词 `status: done` 并移入 `archive/`。

## 验证

- 打开三份规则，确认 Agent 下次写 `lib/` 或页面时能同时看到注释、App Router 与产品易漏项。
