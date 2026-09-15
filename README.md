# ET blog

可自托管的个人博客。第一版按 [docs/todo-v1.md](docs/todo-v1.md) 分阶段实现；产品说明见 [docs/requirements/v1.md](docs/requirements/v1.md)。

对着本仓库学 Next.js：[docs/项目说明](docs/项目说明/README.md)。

当前已完成公开阅读、搜索、暗色模式、RSS/sitemap、访问统计，以及后台登录、发文和图片上传。

**生产上线（coolxu.com）**：自动化运维助手请完整执行 [docs/vps-go-live.md](docs/vps-go-live.md)，不要只读本节摘要。日常更新：把改动推进 **`main`**（或在 Actions 里 Run workflow），由 GitHub 构建镜像；不要默认在 VPS 上 `docker compose up --build`。

## 本地开发

需要 Node.js 20 或以上。

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。站名、作者来自 `.env.local` 里的 `SITE_NAME`、`AUTHOR_NAME`。后台在 [http://localhost:3000/admin](http://localhost:3000/admin)，账号见 `ADMIN_USER`、`ADMIN_PASSWORD`。

生产构建（可选）：

```powershell
npm run build
npm start
```

`next.config.ts` 已设置 `output: "standalone"`，并加上 `X-Accel-Buffering: no`，避免反向代理缓冲流式响应。

## Docker Compose + Caddy

先准备环境变量和 lockfile：

```powershell
Copy-Item .env.example .env
npm install
docker compose up --build
```

- 应用容器监听 3000，由 Caddy 反代。
- 数据卷（绑定到仓库目录）：`content/`、`public/uploads/`、`data/`（SQLite 预留）。
- 本地默认 `SITE_DOMAIN=:80`，用 [http://localhost](http://localhost) 访问（HTTP）。不要写成 `localhost`，否则 Caddy 只在容器内环回地址监听，宿主机进不去。
- 生产把 `.env` 里的 `SITE_DOMAIN` 改成真实域名（不要带 `http://`），Caddy 会尝试自动签发 HTTPS。需要 80/443 对公网开放，并填写 `CADDY_EMAIL`。
- `SITE_NAME`、`AUTHOR_NAME`、`SITE_URL` 会作为 **镜像构建参数** 打进预渲染页（首页、关于）。本地改这三项后必须 `docker compose up --build`，只重启容器不会更新首页站名。生产由 Actions 传入同样的 ARG。密码不要作为 build arg。
- 生产 `app` 镜像名：`ghcr.io/et-coolxu/etblog:${IMAGE_TAG:-latest}`。本地仍可对同一 compose 使用 `--build`。

停止：

```powershell
docker compose down
```

## VPS 上线

给会操作 VPS / DNS / 安全组的自动化助手：只执行 **[docs/vps-go-live.md](docs/vps-go-live.md)**。那是逐步命令、成功标准与失败即停条件的唯一清单。

已确认（细节以该文件为准）：

| 项 | 值 |
|---|---|
| 站名 / 署名 | `CoolXu's Blog` / `coolxu` |
| 站点 | https://coolxu.com |
| 证书邮箱 | `maxxubuly@gmail.com` |
| 文章与简介 | 本阶段不改 |
| 仓库 | https://github.com/ET-coolxu/ETblog.git |

顺序不能反：**先拿到 VPS 公网 IP → 安全组放行 22/80/443 → DNS A 记录指向该 IP 且已生效 → 再 `docker compose up`。** 解析未生效就启动 Caddy，Let's Encrypt 会失败。

生产 `.env` 只存在服务器上，不要提交 Git。`SITE_NAME` 含撇号必须加双引号；`CADDY_EMAIL` 必须是邮箱。容器写 `content/`、`public/uploads/`、`data/` 时属主为 uid `1001`。不要把 3000 端口暴露到公网。

备份这些目录即可保留文章、图片和 PV：`content/`、`public/uploads/`、`data/`。

### 日常更新（GHCR）

触发：push 到 **`main`**，或仓库 Actions → **Deploy to GHCR and VPS** → Run workflow。未推进 `main` 的本地改动不会上线。线上曾跟 `test` 分支，自动化只跟 `main`。

GitHub 仓库 **Settings → Secrets and variables → Actions** 需要：

| 类型 | 名 | 说明 |
|---|---|---|
| Secret | `VPS_HOST` | `117.55.235.105` 或 `coolxu.com` |
| Secret | `VPS_USER` | 现为 `root` |
| Secret | `VPS_SSH_KEY` | 给 Actions 用的专用私钥（VPS `authorized_keys` 放对应公钥） |
| Secret | `GHCR_PULL_TOKEN` | 能 `read:packages` 的 PAT，供 VPS 拉私有镜像 |
| Variable（可选） | `SITE_NAME` / `AUTHOR_NAME` / `SITE_URL` | 缺省为 `CoolXu's Blog` / `coolxu` / `https://coolxu.com` |

VPS 一次性：写入上述公钥；确认 `/opt/etblog` 仍能 `git fetch`（读 compose/Caddy，**不要** `git reset --hard`）。运行时仍读该机 `.env`。

排查：构建失败看 Actions 日志；Secrets 不齐时部署 job 会失败（镜像可能已在 GHCR，但线上未动）；首页仍是旧站名 = CI 没带对 `SITE_NAME` 等 ARG，不是只 recreate。应急仍可在 VPS 上 `--build`（OOM 时加 swap），步骤见 [docs/vps-go-live.md](docs/vps-go-live.md)。

## 当前缺口

- 没有 `package-lock.json` 时，Docker 构建会退回 `npm install`，可复现性较差。本地先跑一次 `npm install` 再构建更稳。
- 本机 Compose 若没有公网域名，Caddy **不会**签发 Let's Encrypt 证书；`localhost` 走 HTTP :80。
- Linux VPS 上若写入 `public/uploads` 或 `data` 报权限错误，把这两个目录的属主改成容器用户（镜像里是 uid `1001`）。见 [docs/vps-go-live.md](docs/vps-go-live.md) 步骤 6。
- SQLite 在 `data/stats.sqlite`。生产环境的 `ADMIN_PASSWORD` 与 `SESSION_SECRET` 必须在 VPS 上另生成，不要用 `.env.example`。

## 目录

```
app/(site)/                 公开站点（阅读、搜索）
app/admin/                  后台（登录、写文章、统计）
app/api/upload/             后台图片上传
app/feed.xml/               RSS
.github/workflows/          GHCR 构建与 VPS 部署
scripts/                    VPS 拉镜像脚本
content/posts/              文章 Markdown
content/pages/              关于页等
public/uploads/             文章图片
data/                       SQLite（stats.sqlite）
lib/                        站点配置、文章读写、搜索、统计、鉴权
```
