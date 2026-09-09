---
name: agent-prompts
description: 在 docs/agent-prompts 中创建、更新、归档并执行提示词。用户提出新需求、优化、架构更新、修 bug，或要写/改/发送提示词时使用。
---

# Agent Prompts

提示词文件是任务的唯一说明：发给 AI 实现，也用来存档和改需求。

## 目录

```
docs/agent-prompts/
  _templates/       # 只作模板，禁止当任务文件改
  features/         # 新需求
  optimizations/    # 优化
  architecture/     # 架构更新
  fixes/            # 缺陷修复
  archive/          # 已完成
```

## 工作流

复制此清单并勾选：

```
- [ ] 1. 定类型与文件名
- [ ] 2. 从模板写提示词，status: draft
- [ ] 3. 补全到可执行，status: ready
- [ ] 4. 按该文件实现（不要另起一套需求）
- [ ] 5. 完成后 status: done，移入 archive/
```

### 1. 定类型与文件名

| 用户在说 | 目录 | 模板 |
|---|---|---|
| 新功能、新页面、新能力 | `features/` | `_templates/feature.md` |
| 性能、体验、可读性、重构但不改产品边界 | `optimizations/` | `_templates/optimization.md` |
| 目录结构、技术选型、数据流、部署拓扑 | `architecture/` | `_templates/architecture.md` |
| 修 bug、回归 | `fixes/` | `_templates/fix.md` |

文件名：`YYYY-MM-DD-short-slug.md`（今天的日期 + 英文短横线 slug）。

已有相近提示词且尚未 `done`：更新那份，不要另开重复文件。已归档的需求要再改：新开一份，`related` 写上旧文件路径。

### 2–3. 写提示词

1. 复制对应模板到目标目录并改名。
2. 填 frontmatter：`title`、`type`、`status`、`created`、`updated`。
3. 正文必须能单独发给 AI 执行，至少包含：背景、目标、非目标、约束、验收标准、验证方式。
4. 对照 `.cursor/rules/project-conventions.mdc`，冲突的需求写进「约束」或「非目标」。
5. 写完把 `status` 改为 `ready`，把路径告诉用户，说明可以 `@` 该文件发给 AI。

聊天里出现的需求、验收、范围变更：立刻写回提示词，再继续改代码。

### 4. 按提示词实现

- 先读目标提示词全文，再读项目约定与相关代码。
- 把 `status` 改为 `in-progress`。
- 只做提示词里的范围；发现缺口就先改提示词。
- 验收标准逐条勾选。

### 5. 归档

1. `status: done`，`updated` 改为当天。
2. 把文件移到 `docs/agent-prompts/archive/`（文件名不变）。
3. 若有未完成项，不要归档；保持 `in-progress` 并写明剩余项。

## status

`draft` → `ready` → `in-progress` → `done`（随后移入 `archive/`）

不要把任务文件放进 `_templates/`。不要只在对话里改需求。
