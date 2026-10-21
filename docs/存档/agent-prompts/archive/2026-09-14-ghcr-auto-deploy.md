---
title: GHCR 自动部署（Actions 构建 + VPS 拉镜像）
type: architecture
status: done
created: 2026-09-14
updated: 2026-09-14
related:
  - docs/vps-go-live.md
  - docs/coolxu-com-deploy.md
  - docs/agent-prompts/archive/2026-09-11-docker-site-env-build.md
  - docs/agent-prompts/archive/2026-09-11-go-live.md
---

# GHCR 自动部署（Actions 构建 + VPS 拉镜像）

请按本提示词做架构更新。先更新文档与约定，再改代码。实现前先读 `.cursor/rules/project-conventions.mdc`。不要编辑 Cursor 的 plan 文件。不要 `git commit` / `git push`。不要跑 `npm install`、`next build`、`docker compose`、真实 SSH 上线。

## 背景

日常更新是 SSH 到 `/opt/etblog`，`git pull` 再 `docker compose up --build`。`next build` 在约 1GB 的 CloudCone 上容易 OOM，而且每次都要人盯。

已选路径：在 GitHub Actions 用 buildx 构建并推到 GHCR；VPS 只 `docker login`、拉镜像、`up -d --no-build`。Caddy 继续用官方镜像，证书卷不动。`content/`、`public/uploads/`、`data/`、`.env` 仍在宿主机绑定目录。

线上仓库曾跟 **`test` 分支**（见 `docs/coolxu-com-deploy.md`）。自动化按 **`main` 触发**。启用前人类须把要上线的提交合并进 `main`；VPS 不必再 `checkout test`。

站名仍是构建期 ARG（`Dockerfile` 的 `SITE_NAME` / `AUTHOR_NAME` / `SITE_URL`）。CI 传入生产值；**密码绝不进 build arg**。运行时仍读 VPS 上的 `.env`。

VPS 上后台写过的 `content/` 可能和 Git 不一致。部署脚本**不要** `git reset --hard`，也不要对整库 `git pull`。只按本次提交 checkout `docker-compose.yml` 和 `Caddyfile`（以及脚本自身）。应用代码完全来自镜像。

## 目标

- `docker-compose.yml` 的 `app` 增加 `image: ghcr.io/et-coolxu/etblog:${IMAGE_TAG:-latest}`（GHCR 要求小写），**保留**现有 `build.context` / `args`，本地仍可 `docker compose up --build`。
- 新增 `.github/workflows/deploy.yml`：`push` 到 `main` + `workflow_dispatch`；buildx 推 `latest` 与 `github.sha`；再 SSH 到 VPS 跑部署脚本。
- 新增 `scripts/vps-deploy-from-ghcr.sh`：登录 GHCR、按 SHA 只 checkout compose/Caddy（及本脚本）、`pull app` + `up -d --no-build`、检查容器 Up。
- 更新 `docs/vps-go-live.md`、`docs/coolxu-com-deploy.md`、`README.md`：日常改为 push `main` / 手动 Run；写清 Secrets 清单、首次启用、应急 `--build`、曾跟 `test` 现跟 `main`。
- `.cursor/rules/project-conventions.mdc` 部署一行补充：生产镜像来自 GHCR，VPS 不再日常 `next build`。

## 非目标

- 不改产品行为、文章、关于页、首页简介。
- 不映射宿主机 3000；不用 `docker compose down -v`。
- 不把密码 / `SESSION_SECRET` / `ADMIN_PASSWORD` 做成 Docker build arg 或打进镜像层。
- 不在本切片对生产做真实 SSH / `docker build` / 端到端上线验收。
- 不修改 Cursor plan 文件；不 `git commit` / `git push`。

## 决策

| 决策 | 选择 | 不选 |
|---|---|---|
| 构建位置 | GitHub Actions + buildx，推 GHCR | 继续在 1GB VPS 上 `next build` |
| 触发 | `main` 的 `push` + `workflow_dispatch` | 继续跟 `test` 分支；仅 webhook |
| 生产镜像 | `ghcr.io/et-coolxu/etblog:${IMAGE_TAG:-latest}` | 每次在 VPS 本地 build 无 image 名 |
| VPS 更新 Git | 只 checkout 本次 SHA 的 compose / Caddyfile / 本脚本 | `git reset --hard`、整库 `git pull` |
| 站点 ARG | CI 用 Variables，缺省写死生产常量 | 密码进 build arg；指望运行时 `.env` 改预渲染首页 |
| 并发 | 同一 workflow 排队（不取消进行中的 SSH） | 两台部署同时抢容器 |

## 约束

- 文章仍以 Markdown 文件为唯一信源，本切片不推翻。
- 不映射 3000；不用 `docker compose down -v`。
- `SITE_NAME` 生产值是 `CoolXu's Blog`（含撇号）。CI 传 build-arg 必须用安全引号，避免 YAML/shell 把撇号截断。
- 生产运行时仍用 VPS `/opt/etblog/.env`（`env_file`）。CI 只负责构建期三项站点 ARG。
- 触发分支是 `main`。文档必须写明：线上曾跟 `test`，启用前把要上线的提交合并进 `main`。
- 禁止 `git reset --hard`，禁止用 Git 覆盖 VPS `content/`。
- 新增导出函数 / 脚本逻辑写中文 JSDoc 或文件头注释（职责、防穿越/防覆盖、不要 echo token）。
- 界面文案中文（本切片几乎无 UI；文档用中文）。
- Actions 权限：`packages: write`、`contents: read`。推包用 `GITHUB_TOKEN`。VPS 拉私有包用 PAT（`read:packages`），不要把 PAT 写进仓库。
- 构建成功但 Secrets 未齐：部署 job **必须失败**并打印缺哪几项，避免「镜像有了线上没动」却绿勾。
- 仓库/包名：GitHub 为 `ET-coolxu/ETblog`，GHCR 镜像名必须小写 `ghcr.io/et-coolxu/etblog`。

## 影响面

- 目录/模块：`docker-compose.yml`、`.github/workflows/deploy.yml`、`scripts/vps-deploy-from-ghcr.sh`。
- 数据流：应用代码来自镜像；文章/图片/SQLite/证书仍在宿主机卷；compose/Caddy 按 SHA 从 Git 取文件。
- 部署：push `main` 或手动 Run → GHCR → SSH `/opt/etblog` pull + up。
- 需要同步修改的规则或提示词：`project-conventions.mdc` 部署一句；本文件归档到 `docs/agent-prompts/archive/`；`docs/agent-prompts/README.md` 加一条。

## GitHub Secrets / Variables（只写进文档，不要写进 Git）

**Secrets**

| 名 | 用途 |
|---|---|
| `VPS_HOST` | `117.55.235.105` 或 `coolxu.com` |
| `VPS_USER` | 现为 `root` |
| `VPS_SSH_KEY` | Actions 专用私钥（VPS 放对应公钥） |
| `GHCR_PULL_TOKEN` | 能 `read:packages` 的 PAT，给 VPS 拉私有镜像 |

**Variables（非密钥；可缺省，workflow 回落到生产常量）**

| 名 | 生产缺省 |
|---|---|
| `SITE_NAME` | `CoolXu's Blog` |
| `AUTHOR_NAME` | `coolxu` |
| `SITE_URL` | `https://coolxu.com` |

## 验收标准

- [x] `docker-compose.yml` 的 `app` 同时有 `image: ghcr.io/et-coolxu/etblog:${IMAGE_TAG:-latest}` 与现有 `build`/`args`；未映射 3000
- [x] `.github/workflows/deploy.yml`：触发 `main` + `workflow_dispatch`；`concurrency` 排队；`packages: write`；buildx 打 `latest` 与 sha；站点 ARG 无密码；Secrets 缺失时部署 job 失败并列出缺项
- [x] `scripts/vps-deploy-from-ghcr.sh`：`docker login` 不把 token 打进日志；只 checkout 指定文件；**没有** `reset --hard` / 整库 pull；`pull app` + `up -d --no-build`；检查 app 已 Up
- [x] 三份文档写清：日常 push `main` 或 Run workflow；首次 Secrets/公钥/`main` 含线上代码；应急仍可 `--build`；曾跟 `test`
- [x] `project-conventions.mdc` 部署句已反映 GHCR
- [x] 未改 `content/`；未改 plan 文件

## 实现顺序

1. 本提示词 `status: ready` 后改为 `in-progress`。
2. 改 `docker-compose.yml` 的 `image`。
3. 写 `scripts/vps-deploy-from-ghcr.sh`。
4. 写 `.github/workflows/deploy.yml`。
5. 更新三份运维文档 + conventions + 提示词 README。
6. `status: done`，移到 `docs/agent-prompts/archive/2026-09-14-ghcr-auto-deploy.md`。

## 实现要点

### compose

`app` 服务在 `build` 之上增加：

```yaml
image: ghcr.io/et-coolxu/etblog:${IMAGE_TAG:-latest}
```

生产：`IMAGE_TAG=<sha> docker compose pull app && IMAGE_TAG=<sha> docker compose up -d --no-build`。不要带 `--build`。

### workflow

建议拆成 `build` 与 `deploy` 两个 job（`deploy` needs `build`）。

- checkout → `docker/login` 到 `ghcr.io`（`GITHUB_TOKEN`）→ setup-buildx → 构建 linux/amd64 → tags `ghcr.io/et-coolxu/etblog:latest` 与 `ghcr.io/et-coolxu/etblog:${{ github.sha }}` → push。
- 站点 ARG：Variables 非空则用，否则 `CoolXu's Blog` / `coolxu` / `https://coolxu.com`。撇号用 heredoc/`GITHUB_OUTPUT` 分隔符或 YAML 双引号，禁止无引号截断。
- `deploy` 开头检查 `VPS_HOST`、`VPS_USER`、`VPS_SSH_KEY`、`GHCR_PULL_TOKEN`；缺则 `echo` 中文缺项并 `exit 1`。
- SSH（如 `appleboy/ssh-action`）：把 `IMAGE_TAG=$GITHUB_SHA`、`GHCR_PULL_TOKEN`、登录用户（可用 `github.repository_owner`）传给远端。先 `git fetch` 并 checkout **本脚本**（防止 VPS 上还没有文件），再 `bash scripts/vps-deploy-from-ghcr.sh`。`concurrency.group` 固定，`cancel-in-progress: false`。

### VPS 脚本

1. `cd /opt/etblog`（可用 `APP_DIR` 覆盖，默认该路径）。
2. `IMAGE_TAG`、`GHCR_PULL_TOKEN` 必填；缺则失败。
3. `echo "$GHCR_PULL_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin`（默认用户 `ET-coolxu`）。不要 `set -x` 打出 token。
4. `git fetch origin` 后：`git checkout "$IMAGE_TAG" -- docker-compose.yml Caddyfile scripts/vps-deploy-from-ghcr.sh`。禁止 `git reset --hard`、禁止对整库 `git pull`。
5. `IMAGE_TAG=... docker compose pull app`
6. `IMAGE_TAG=... docker compose up -d --no-build`
7. `docker compose ps`；确认 `app` 为 running，否则打 logs 并失败。可用本机 curl 80/443 作辅助，但不要依赖宿主机 3000。

回滚（写进文档即可）：手动指定旧 SHA 再跑 pull + `up -d --no-build`。

### 文档必须出现的内容

- 日常：push `main` 或 Actions 里 Run workflow。未 push 的本地改动不会上线。
- 首次：配 Secrets / Variables；VPS 写入 Actions 公钥；确认 `main` 已含线上代码（含尚未提交的上传修复须先合并）。
- 排查：构建看 Actions 日志；线上仍旧站名 = CI 没带对 ARG，不是「只 recreate」。
- 应急：仍可在 VPS `git fetch` 后对 compose 文件 checkout，再 `docker compose up --build`（OOM 时加 swap）。
- 明确：不要 `down -v`、不要映射 3000、不要 hard reset。

## 验证

- 通读 workflow / 脚本 / compose：无 `reset --hard`、无 `ports: "3000:3000"`、无 `down -v`、无密码 build-arg。
- 不跑 docker build、不 SSH 生产、不端到端真实部署。人类合入后自行：填 Secrets → push `main` 或 Run → 看 Actions 与 https://coolxu.com ，再到写文章页传一张图。
