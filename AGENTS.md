# AGENTS

本仓库用「提示词先行」驱动开发。

产品说明：`docs/requirements/v1.md`。执行清单：`docs/todo-v1.md`。改产品行为先改 PRD，再改提示词与 TODO，再改代码。

1. 新需求、优化、架构更新、修 bug：先在 `docs/agent-prompts/` 写提示词，再改代码。
2. 实现时 `@` 对应提示词文件，或让 agent 按该文件执行。
3. 改需求先改 PRD 与提示词；完成后把文件移到 `docs/agent-prompts/archive/`。

规则：`.cursor/rules/agent-prompts.mdc`、`.cursor/rules/project-conventions.mdc`  
技能：`.cursor/skills/agent-prompts/SKILL.md`  
用法：`docs/agent-prompts/README.md`
