# AGENTS

产品说明在 `docs/requirements/`。做哪一版以用户说出的「现在开始做 V…」为准。目录和构建见 `docs/架构/项目架构.md`。

自然语言描述新需求、优化或架构，且没有明确说实现时：只整理提示词，不写业务代码。流程见 `.cursor/skills/agent-prompts/SKILL.md`。用户明确说「按这个实现」之后才写代码。

规则：`.cursor/rules/project.mdc`、`.cursor/rules/iteration.mdc`、`.cursor/rules/agent-prompts.mdc`、`.cursor/rules/app.mdc`、`.cursor/rules/mcp.mdc`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
