# AGENTS

产品说明：公开站 `docs/requirements/v1.md`；后台工作台 `docs/requirements/v2-admin.md`。执行清单：`docs/todo-v1.md`。改产品行为先改 PRD。核心功能与逻辑再写提示词，然后改代码。

1. 新能力、行为、数据读写、鉴权、架构、逻辑缺陷：先在 `docs/agent-prompts/` 写提示词，再改代码。文案、样式、格式等简单修改直接改。
2. 需要提示词时，实现时 `@` 对应文件，或让 agent 按该文件执行。
3. 改核心需求先改 PRD 与提示词；完成后把文件移到 `docs/agent-prompts/archive/`。

规则：`.cursor/rules/main.mdc`、`.cursor/rules/project-conventions.mdc`、`.cursor/rules/nextjs-app.mdc`、`.cursor/rules/agent-prompts.mdc`  
技能：`.cursor/skills/agent-prompts/SKILL.md`  
用法：`docs/agent-prompts/README.md`
