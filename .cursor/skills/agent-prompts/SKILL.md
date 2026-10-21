---
name: agent-prompts
description: >-
  Compiles simple requirement/optimization descriptions into ready-to-paste prompts,
  saves them under docs/agent/use Prompt, maintains the docs/agent prompt library,
  and aligns prompts with .cursor/rules. Use when the user describes a new feature or
  optimization in plain language, attaches screenshots, asks to 整理提示词/生成提示词,
  mentions docs/agent、新需求、优化、架构、use Prompt, or when proposing prompt-library updates.
---

# Agent 提示词库（docs/agent）

## 分层职责

| 层 | 路径 | 职责 |
|----|------|------|
| Rule | `.cursor/rules/agent-prompts.mdc` | 轻量触发：整理模式 / 库迭代提醒 |
| Skill | 本文件 | 整理、选用、迭代的完整流程 |
| 类型模板 | `docs/agent/新需求.md`、`优化.md`、`架构.md` 等 | 可复用的通用提示词骨架 |
| 会话成品 | `docs/agent/use Prompt/` | 已填好、可复制到其他会话的提示词 |

冲突时以 `.cursor/rules`、`docs/requirements/` 和 `docs/架构/项目架构.md` 为准，并提议更新过时的类型模板。提示词库不替代 `docs/requirements/`。

## 本项目

整理提示词时读取这些文件，不要沿用其它仓库的约定：

- `docs/requirements/`（只读用户本次说的「现在开始做 V…」那一版，并核对它尚未取代的更早条目；没说明时先问）
- `docs/publish-api.md`
- `docs/架构/项目架构.md`
- `.cursor/rules/project.mdc`
- `.cursor/rules/app.mdc`
- `.cursor/rules/mcp.mdc`

稳定约束以 `.cursor/rules/project.mdc` 和类型模板里的「前置约束」为准。某一期才禁止的交互不要写进类型模板，那些随 `.cursor/rules/iteration.mdc` 更新。

## 默认模式：整理提示词（优先）

用户用**简单自然语言**描述新需求 / 优化 / 架构设计 / 方案（可带截图），且**未**明确要求「按这个实现 / 开始写代码」时：

**只整理提示词，不写业务代码。**

### 流程

1. **选型**：判断 `新需求`、`优化` 或 `架构`；不确定则问一句
   - **架构**：功能域分层/模块边界/数据流/状态归属尚不清，需要先出设计方案
   - **新需求**：范围相对清晰，目标是澄清后实现功能
   - **优化**：已有实现，要改结构、性能或代码质量
2. **追问**：对照所选模板的缺口提问（目标、范围、页面/逻辑、约束、验收、相关路径、截图含义等），消除假设后再生成
3. **读模板**：读取 `docs/agent/新需求.md`、`优化.md` 或 `架构.md`（及现行 rules），不要凭记忆硬套过期细则
4. **出草稿**：在回复中用普通 Markdown 给出完整提示词（**禁止**用代码围栏包裹整段提示词，以免破坏内部 Markdown 结构）。用标题区分元信息与正文，例如以 `## 提示词正文` 起头
5. **确认后落盘**：用户确认（如「确认 / 可以 / 保存」）后，写入  
   `docs/agent/use Prompt/<文件名>.md`（LF）  
   文件结构见下；未确认前不写入该目录
6. **实现开关**：仅当用户明确说「按这个实现 / 开始做 / 在本会话执行」等之后，才按该提示词写代码；否则即使提示词已保存也保持只整理（`架构` 类型默认到设计结束为止）

### 落盘文件格式

路径：`docs/agent/use Prompt/`  
命名：`YYYYMMDD-简短中文标题-新需求.md`、`…-优化.md` 或 `…-架构.md`（标题由内容概括，避免空格与特殊符号）

文件为普通 Markdown：上方元信息，`---` 分隔后是可复制的提示词正文（仍是 Markdown，不用代码围栏）：

```markdown
# <简短标题>

- 类型：新需求 | 优化 | 架构
- 来源会话：（可选）一句话背景
- 状态：已确认

复制下方「提示词正文」整节（含该二级标题之下全部内容）到新会话即可。

---

## 提示词正文

（填好占位后的完整提示词，保持 Markdown 标题/列表/代码块可用）
```

### 触发示例

- 「我要做这个功能（附图），先给我开发方案提示词」
- 「这块功能怎么分层、状态放哪，帮我整理成架构提示词」
- 「整理成新需求提示词，确认后我拷到别的会话」
- 简单描述需求/优化/架构但未贴完整提示词 → 默认走本模式

## 执行模式（需明确指令）

仅当用户明确要求按提示词**实现**时：

1. 以 `docs/agent/use Prompt/` 中已确认文件的「提示词正文」为准（或用户粘贴的同等 Markdown）
2. 按其中工作流程执行；并遵守 `.cursor/rules`、`docs/requirements/` 与 `docs/架构/项目架构.md`

## 迭代类型模板（必须确认制）

改 `docs/agent/新需求.md`、`优化.md`、`架构.md` 或新增通用类型时：

1. 架构/约定变化、任务沉淀、用户要求、与 rules 冲突时，回复末尾提「提示词库建议」
2. **先建议，后写入**；未确认禁止改类型模板
3. 仅新增中文命名的**通用**类型；禁止为单次需求建类型文件（单次成品进 `use Prompt/`）
4. 新类型结构见 [template.md](template.md)

> **提示词库建议**  
> 建议更新 `docs/agent/优化.md`：……  
> 是否按此更新？

## 与 Rule 联动

- 自然语言需求/优化/架构且未要求实现 → Rule 提醒走「整理提示词」
- `use Prompt/` 写入须用户确认草稿之后
- 类型模板迭代与 Rule 精简策略不变：细节留在 Skill，避免三处全文重复
