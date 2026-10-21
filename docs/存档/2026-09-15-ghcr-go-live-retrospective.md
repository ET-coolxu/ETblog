# coolxu.com GHCR 自动部署：首次启用复盘（2026-09-15）

> 整理自首次把生产从「VPS 本地 `docker compose up --build`」切到「GitHub Actions 构建 → GHCR → VPS 只拉镜像」的实操。  
> 运维清单仍以 `docs/vps-go-live.md` 为准；环境差异见 `docs/coolxu-com-deploy.md`。  
> 本次之后的分支约定（PR → `test` → 验证 → `main`）见项目约定与 `docs/agent-prompts/archive/2026-09-15-test-then-main-workflow.md`。

## 1. 目标与结果

| 项 | 内容 |
|---|---|
| 站点 | https://coolxu.com |
| VPS | `117.55.235.105`（CloudCone，AlmaLinux 8.9） |
| 仓库 | https://github.com/ET-coolxu/ETblog |
| 成功标准 | Actions 构建并推 GHCR；SSH 在 VPS 执行 `scripts/vps-deploy-from-ghcr.sh`；HTTPS 验收通过 |
| 最终线上镜像 | `ghcr.io/et-coolxu/etblog:44aff5303b1d41ac088230fec770682c554c76b5` |
| 成功 run | https://github.com/ET-coolxu/ETblog/actions/runs/34940570204 |

验收摘要：

- `http://coolxu.com` → **308** 到 HTTPS  
- 首页标题为 **CoolXu's Blog**（不是「个人博客」）  
- `/robots.txt` 的 Sitemap 为 `https://coolxu.com/sitemap.xml`  
- 草稿 `/posts/unfinished-draft` → **404**  
- `/admin` → 登录页（非 500）  
- VPS 上 `app` / `caddy` 均为 Up；应用镜像来自 GHCR，不再是本机构建的 `etblog-app`

## 2. 流程（首次启用）

### 2.1 一次性准备

1. **确认 `main` 已含要上线的代码**（含 GHCR workflow、`scripts/vps-deploy-from-ghcr.sh`、compose 的 `image:`）。线上 Git 工作区曾长期跟 `test`，自动化只跟 `main`。  
2. **生成 Actions 专用 SSH 密钥对**；公钥写入 VPS `root` 的 `~/.ssh/authorized_keys`（权限 `700`/`600`）。不要用登录密码当 Secret。  
3. **GitHub → Settings → Secrets and variables → Actions** 填写：

| 类型 | 名 | 用途 |
|---|---|---|
| Secret | `VPS_HOST` | `117.55.235.105` 或 `coolxu.com` |
| Secret | `VPS_USER` | `root` |
| Secret | `VPS_SSH_KEY` | Actions 专用私钥（完整 PEM） |
| Secret | `GHCR_PULL_TOKEN` | 带 `read:packages`（及常用 `repo`/`workflow`）的 PAT，供 VPS 拉私有包 |
| Variable（可选） | `SITE_NAME` / `AUTHOR_NAME` / `SITE_URL` | 缺省 `CoolXu's Blog` / `coolxu` / `https://coolxu.com` |

4. 手动 **Run workflow** 或 push `main`，观察 build → deploy。  
5. VPS **不要** `git reset --hard` / 整库 `git pull` 覆盖 `content/`。宿主机 HEAD 停在旧分支没关系，应用以镜像为准。

### 2.2 日常更新

1. 功能改动经 PR：**先合入 `test`，验证后再合入 `main`**（见项目约定）。  
2. 推到 **`main`**（或 Actions 里对 **Deploy to GHCR and VPS** 选 `main` 手动 Run）→ buildx 推 `latest` + `sha` → SSH 拉镜像 → `up -d --no-build`。  
3. **不要**默认在 CloudCone 小内存机器上 `next build`。
4. push / PR 到 **`test`** 会跑同一套 Docker 构建（拦住 TS 等错误），但 **不** 推 GHCR `latest`、**不** SSH。

## 3. 本次踩坑与修复

### 3.1 `SITE_NAME` 撇号导致 shell EOF

- **现象**：首次手动 Run 失败在「解析站点构建参数」：`unexpected EOF while looking for matching '''`。  
- **根因**：Variables 已是 `CoolXu's Blog`，但脚本写成 `SITE_NAME="${SITE_NAME_VAR:-CoolXu's Blog}"`，bash 在解析默认值时把撇号当成未闭合单引号。  
- **修复**：空值时用普通双引号赋缺省，不再把带撇号的字面量写进 `${var:-...}`（PR #1）。

### 3.2 `Buffer` 不能作为 `BodyInit`（TS2345）

- **现象**：站点参数修好后，Docker/`npm run build` 挂在 `app/uploads/[...path]/route.ts`。  
- **根因**：Next.js 16 + TypeScript 5.9 + 新版 `@types/node` 下，`Buffer<ArrayBufferLike>` 与 DOM `BodyInit` 不兼容。  
- **修复**：响应体改为 `Uint8Array.from(...)` 再交给 `NextResponse`（PR #2）。  
- **说明**：该问题在 VPS 旧镜像上可能一直没暴露；**一进 Actions 干净构建就会拦下**，说明「先在 test/CI 构建再进 main」很有价值。

### 3.3 其它注意点（未再踩、但文档已强调）

- AlmaLinux 上 `get.docker.com` 可能拒装 → 用 Docker CE 的 CentOS/RHEL 源（见 `coolxu-com-deploy.md`）。  
- 权威 DNS 在西部数码，不在 CloudCone DNS 面板。  
- 站名 / robots / sitemap 绝对地址是 **镜像构建 ARG**；只 recreate 容器不够。  
- Secrets 不齐时：镜像可能已在 GHCR，但部署 job 会失败并列出缺项——看起来「构建绿了线上没动」。

## 4. 分支策略（本次之后的约定）

| 分支 | 用途 |
|---|---|
| 功能分支 | 开发；开 PR **目标分支为 `test`** |
| `test` | 集成验证：合并后看 CI/构建是否通过，必要时人工点开站点或读 Actions 日志。同一 workflow **只构建、不 SSH** |
| `main` | 生产：合并后自动 **Deploy to GHCR and VPS**（推 `latest` + sha 并 SSH） |

禁止把未在 `test` 验证过的改动直接推进 `main`（紧急热修需在 PR/提交说明里写明原因）。

## 5. 回滚与备份

- **回滚镜像**：对旧 SHA 设 `IMAGE_TAG=<旧sha>` 再跑 `scripts/vps-deploy-from-ghcr.sh`（镜像仍在 GHCR 的前提下），或对旧 commit 手动 Run workflow。  
- **备份**：异地保存 `content/`、`public/uploads/`、`data/`（可选私密保存 `.env`）。不要依赖 Git 里的上传与统计库。  
- **禁止**：`docker compose down -v`（会丢 Caddy 证书卷）；公网映射 3000；`git reset --hard` 覆盖 VPS 上后台写过的文章。

## 6. 相关链接

- 清单：`docs/vps-go-live.md`  
- 环境记录：`docs/coolxu-com-deploy.md`  
- 架构说明归档：`docs/agent-prompts/archive/2026-09-14-ghcr-auto-deploy.md`  
- 分支流归档：`docs/agent-prompts/archive/2026-09-15-test-then-main-workflow.md`  
- Workflow：`.github/workflows/deploy.yml`  
- VPS 脚本：`scripts/vps-deploy-from-ghcr.sh`

---

*文档日期：2026-09-15。密钥与 PAT 以 GitHub Secrets / 服务器 `.env` 为准，不要写进仓库或文章正文。*
