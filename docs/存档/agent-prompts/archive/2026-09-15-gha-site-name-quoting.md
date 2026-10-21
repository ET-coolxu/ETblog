---
title: 修复 Actions 站点构建参数撇号导致 unexpected EOF
type: fix
status: done
created: 2026-09-15
updated: 2026-09-15
related:
  - docs/agent-prompts/archive/2026-09-14-ghcr-auto-deploy.md
  - .github/workflows/deploy.yml
---

# 修复 Actions 站点构建参数撇号导致 unexpected EOF

请按本提示词修复，不要顺手做无关重构。实现前先读 `.cursor/rules/project-conventions.mdc` 与 `.github/workflows/deploy.yml`。

## 背景

Workflow `.github/workflows/deploy.yml` 的 job「Build and push GHCR」、step「解析站点构建参数」在仓库 `ET-coolxu/ETblog` 失败。

失败 run：https://github.com/ET-coolxu/ETblog/actions/runs/34939517363（commit `d0f6583`，`main`，`workflow_dispatch`）。

实际错误：

```
/home/runner/work/_temp/….sh: line 2: unexpected EOF while looking for matching `''
```

对应脚本行：

```bash
SITE_NAME="${SITE_NAME_VAR:-CoolXu's Blog}"
```

即使 `SITE_NAME_VAR` 已由 Actions Variables 设为 `CoolXu's Blog`，bash **仍会解析** `${...:-word}` 里的默认值。双引号内的 `${var:-CoolXu's Blog}` 会把撇号当成未闭合单引号，于是 unexpected EOF。heredoc 写入 `GITHUB_OUTPUT` 尚未执行。

生产站名必须是 `CoolXu's Blog`（含撇号）；Variables 可能设置 `SITE_NAME` / `AUTHOR_NAME` / `SITE_URL`；缺省仍为 `CoolXu's Blog` / `coolxu` / `https://coolxu.com`。

## 复现步骤

1. 用 bash 执行：`SITE_NAME="${SITE_NAME_VAR:-CoolXu's Blog}"`（无论 `SITE_NAME_VAR` 是否为空）。
2. 或在 GitHub 上对当前 `main` 的 Deploy workflow 点 Run workflow。
3. 「解析站点构建参数」失败，exit code 2，日志含 `unexpected EOF while looking for matching \`''`。

## 目标

- 「解析站点构建参数」对含撇号及其他常见特殊字符的站点名健壮，不能因 `CoolXu's Blog` 失败。
- 继续把 `SITE_NAME`、`AUTHOR_NAME`、`SITE_URL` 作为 docker/build-push-action 的 build-args。
- 缺省值保持 `CoolXu's Blog` / `coolxu` / `https://coolxu.com`。

## 非目标

- 不把密码 / `SESSION_SECRET` / `ADMIN_PASSWORD` 做成 build-arg。
- 不改应用产品行为、`content/`、VPS 部署脚本逻辑（除非同一处引用也有相同引号 bug，才做极小相关修复）。
- 不改触发条件（`push` `main` + `workflow_dispatch`）、GHCR 标签（`latest` + sha）、Secrets 检查行为。
- 不合入 `main`。

## 约束

- 优先最小改动 `.github/workflows/deploy.yml`。
- 默认值不要写进 `${var:-...}`，避免 bash 解析撇号。
- Variables 经 `env:` 注入（环境变量不经 shell 再引号一次）；空则在脚本里用普通双引号赋值缺省。
- 写入 `GITHUB_OUTPUT` 继续用 heredoc 分隔符，避免特殊字符截断 output。
- 新增/改动的步骤注释用中文，说明为什么不能用 `${var:-CoolXu's Blog}`。
- 不要跑 `npm install`、`next build`、`docker compose`、真实 SSH。

## 验收标准

- [x] 本地用 bash 跑与 workflow 等价的赋值 + `GITHUB_OUTPUT` 写入：`SITE_NAME_VAR` 为空、为 `CoolXu's Blog` 时都成功，输出值为 `CoolXu's Blog`。
- [x] 旧写法 `SITE_NAME="${SITE_NAME_VAR:-CoolXu's Blog}"` 仍能复现 `unexpected EOF`（对照，证明根因）。
- [x] `deploy.yml` 仍把三个站点参数传给 `docker/build-push-action` 的 `build-args`。
- [x] 触发、镜像标签、Secrets 检查、VPS SSH 步骤未改行为。
- [x] 开 PR，说明根因与修复；不要 merge。

## 涉及范围

- 文件/模块：`.github/workflows/deploy.yml`（主要）；本提示词。

## 实现要点

- 用 `if [ -z "$SITE_NAME_VAR" ]; then SITE_NAME="CoolXu's Blog"; else SITE_NAME="$SITE_NAME_VAR"; fi`（或等价的 `[ -n "$SITE_NAME_VAR" ] || SITE_NAME="CoolXu's Blog"`），**不要** `${SITE_NAME_VAR:-CoolXu's Blog}`。
- 站名缺省只出现在普通双引号字符串里：`"CoolXu's Blog"` 对 bash 合法。
- `GITHUB_OUTPUT` 保持 `name<<DELIMITER` 多行语法；分隔符避免与内容冲突（可继续 EOF，或换成更不易碰撞的标记）。

## 验证

- 本地 bash：复现旧错 + 跑新脚本写入临时 `GITHUB_OUTPUT`，检查 `site_name` 为 `CoolXu's Blog`。
- 不在本切片对生产做真实 Deploy；PR 说明合入后如何再 Run「Deploy to GHCR and VPS」。
