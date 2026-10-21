---
title: test 验证后再合 main（CI 构建不部署）
type: architecture
status: done
created: 2026-09-15
updated: 2026-09-15
related:
  - docs/2026-09-15-ghcr-go-live-retrospective.md
  - docs/vps-go-live.md
  - docs/coolxu-com-deploy.md
  - .github/workflows/deploy.yml
  - docs/agent-prompts/archive/2026-09-14-ghcr-auto-deploy.md
  - docs/agent-prompts/archive/2026-09-15-gha-site-name-quoting.md
  - docs/agent-prompts/archive/2026-09-15-upload-route-bodyinit.md
---

# test 验证后再合 main（CI 构建不部署）

请按本提示词做架构更新。先更新文档与约定，再改代码。实现前先读 `.cursor/rules/project-conventions.mdc`。不要编辑 Cursor 的 plan 文件。不要改 `content/posts/` 或关于页产品文案。不要把真实密码、PAT、私钥写进仓库。

本切片的 PR **目标分支是 `test`**，不要合入、不要把 PR 打向 `main`。

## 背景

首次 GHCR 上线时，`SITE_NAME` 撇号与 `Buffer`/`BodyInit` 类型错误都是推上 `main` 后才被 Actions 干净构建拦住。`test` 当时没有同等构建门禁，生产部署又只跟 `main`，缺少「先集成验证再上线」的固定路径。

复盘见 `docs/2026-09-15-ghcr-go-live-retrospective.md`（从附件草稿落盘，中文；不要编造密钥）。

## 目标

- 编码分支流：功能分支 PR **合入 `test`** → 验证（CI 构建绿；可选人工）→ 再把 `test` 合入 `main`（推荐走 PR）。
- 生产 GHCR + VPS 部署**只跟 `main`**。`test` 上不得自动 SSH。
- `test`（push 与向 `test` 开的 PR）跑与生产相同的 Docker/`next build`，TypeScript 等构建错误要失败；**不**推覆盖生产的 `latest`，**不**跑部署 job。
- `workflow_dispatch` 在 **main** 上仍走完整部署。
- 更新约定与运维文档：日常是 PR → `test` → 验证 → `main` → Actions 部署。写明 VPS 上 git HEAD 可能仍像旧 `test`，应用以镜像为准。
- 可选：在 `docs/agent-prompts/README.md` 加短指针。

## 非目标

- 不改产品行为、文章、关于页、首页简介。
- 不从 `test` 自动 SSH 部署；不把 `test` 构建结果打成 GHCR `latest`。
- 不把密码 / PAT / 私钥写进仓库。
- 本切片不在 VPS 上真实部署、不 `next build` / `docker compose` / `npm install`（本地验证以通读 workflow 与现有 Actions 行为为准）。

## 决策

| 决策 | 选择 | 不选 |
|---|---|---|
| CI 落点 | 扩展 `.github/workflows/deploy.yml`：`test`+`main` 都构建 | 另开一套会漂移的构建脚本 |
| 部署 | `deploy` job `if: github.ref == 'refs/heads/main'` 且非 PR | `test` 也 SSH |
| GHCR 推包 | 仅 `main` 的 push / `workflow_dispatch` 推 `latest` + sha | `test` 推 `latest`（会污染生产 tag） |
| 并发 | main 单独排队且不取消进行中的 SSH；test/PR 另一组 | test 构建与生产部署抢同一 `deploy-coolxu` 组 |
| `test` 落后 main 的热修 | 本分支 cherry-pick 撇号修复与上传路由 `Uint8Array`（否则 test CI 会红） | 只加 workflow、让 test 构建必挂 |

## 约束

- 文章仍以 Markdown 文件为唯一信源。
- `SITE_NAME` 含撇号：workflow shell **禁止** `${var:-CoolXu's Blog}`；缺省用独立双引号赋值（见已归档撇号修复）。
- 禁止 `git reset --hard` 覆盖 VPS `content/`。
- 不映射 3000；不用 `docker compose down -v`。
- 界面与文档中文。

## 影响面

- 目录/模块：`.github/workflows/deploy.yml`；文档与 `project-conventions.mdc`。
- 数据流：不变。应用代码仍来自 `main` 构建的镜像。
- 部署：仅 `main` → GHCR → SSH。`test` 只验证构建。
- 需要同步修改的规则或提示词：`project-conventions.mdc`；运维文档与 README；本文件完成后归档。

## 验收标准

- [x] 功能分支 PR 默认合入 `test` 的约定已写入 `project-conventions.mdc`
- [x] `docs/vps-go-live.md`、`docs/coolxu-com-deploy.md`、README 日常流程为 PR→test→验证→main→Actions；写明 VPS git HEAD 可能仍是旧 `test`、应用以镜像为准
- [x] `deploy.yml`：push/PR 到 `test` 会 Docker 构建；部署 job 只在 `main`（含该分支上的 `workflow_dispatch`）；`test` 不推 `latest`、不 SSH
- [x] 站名缺省赋值撇号安全
- [x] `docs/2026-09-15-ghcr-go-live-retrospective.md` 已落盘（中文，无真实密钥）
- [x] 未改 `content/`；PR 目标为 `test`

## 实现顺序

1. 本提示词 `status: ready` 后改为 `in-progress`。
2. cherry-pick 已在 `main` 的撇号修复与 `Uint8Array` 修复到本分支（`test` 尚无）。
3. 改 `deploy.yml`。
4. 更新约定与三份文档 + 提示词 README；落盘复盘文档。
5. `status: done`，移到 `docs/agent-prompts/archive/`。

## 验证

- 通读 workflow：`test`/PR 路径无 SSH、无 `push: true` 到 `latest`；`main`+`workflow_dispatch` 仍部署。
- 不跑 docker build / 不 SSH 生产。人类在 PR 合入 `test` 后看 Actions：构建 job 跑、部署 job 跳过。
