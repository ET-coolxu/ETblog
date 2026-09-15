# VPS 上线操作清单（自动化助手专用）

你是运维操作员，不是开发者。

**只执行本文件。** 逐步做，上一步未达「成功标准」就停，把失败原因和已拿到的公网 IP 回报给人类。不要改应用代码，不要改 `content/`、`Caddyfile`、`docker-compose.yml`、`Dockerfile`。

人类把本文件发给你时，默认你能：SSH 进 VPS、改云厂商安全组、改域名 DNS。若某一能力没有，停在该步并说明缺什么。

**日常更新不要走本文件的 `git pull` + `--build`。** 流程：功能 PR **合入 `test`** → CI Docker / `next build` 通过（可选人工抽查）→ 再把 `test` 合入 **`main`**（推荐走 PR）→ Actions 构建镜像并 SSH 拉 GHCR。VPS 只 pull。首次装机仍按下列步骤 0–9。宿主机 Git HEAD 可能仍停在旧 `test`，应用以镜像为准，不要用 `git reset --hard` 去对齐。

---

## 常量（不要改）

```
SITE_NAME=CoolXu's Blog
AUTHOR_NAME=coolxu
SITE_URL=https://coolxu.com
SITE_DOMAIN=coolxu.com
CADDY_EMAIL=maxxubuly@gmail.com
ADMIN_USER=admin
GIT_HTTPS=https://github.com/ET-coolxu/ETblog.git
GIT_SSH=git@github.com:ET-coolxu/ETblog.git
APP_DIR=/opt/etblog
CONTAINER_UID=1001
```

只上线 apex `coolxu.com`。不上 `www`。不上 CDN。不要给域名开 Cloudflare 橙色云朵（代理）。

`ADMIN_PASSWORD` 与 `SESSION_SECRET` **不要**写进 Git、不要复用仓库 `.env.example` 里的值。在 VPS 上生成，只写入该机 `.env`。

---

## 禁止

- 不要修改 `content/posts/`、`content/pages/` 里任何文件（含示例文章、草稿、`test.md`、关于页）。
- 不要 `docker compose down -v`（会删 Caddy 证书卷）。
- 不要把宿主机 **3000** 端口映射到公网；compose 里已是 `expose`，不要改成 `ports: "3000:3000"`。
- 不要 `git reset --hard`，不要对 `/opt/etblog` 整库 `git pull` 来覆盖后台写过的 `content/`。
- 不要 `git add .env` 或提交 `.env`。
- 不要把生产密码写回仓库的 `.env.example`。
- 不要在 DNS 未指向本机时执行「启动 Compose」。
- 不要添加 AAAA 记录，除非已确认 VPS 有可路由的 IPv6。
- 不要改首页简介代码（`lib/site.ts`）。

---

## 步骤 0 — 确认人类输入

若人类已指定 `ADMIN_PASSWORD`，使用该值。否则你在步骤 5 生成，并在全部完成后**只向人类回报一次**（不要写进仓库、不要贴到公开日志）。

成功标准：已知将使用的 Git 分支。未指定时先试 `main`；若 `main` 没有 `app/admin` 或 `docker-compose.yml`，改用 `dev`。

---

## 步骤 1 — SSH 进 VPS，记录公网 IPv4

```bash
hostnamectl
ip -4 addr show
curl -4 -fsS ifconfig.me && echo
free -h
df -h /
```

成功标准：

- 系统是 Ubuntu 或 Debian（本清单按 `apt` + Docker 官方脚本）。若是 CentOS/RHEL，停下来说明需换包管理器。
- 得到**公网 IPv4**，下文记为 `VPS_IP`。
- 磁盘剩余建议 > 5GB。

内存：若 `Mem` 总量低于约 1.5GiB，先加 2GiB swap 再构建：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

若 `/swapfile` 已存在并已启用，跳过。

---

## 步骤 2 — 云安全组 / 防火墙

在云厂商安全组（或等价防火墙）放行入站：

| 端口 | 协议 | 用途 |
|---|---|---|
| 22 | TCP | SSH |
| 80 | TCP | HTTP / ACME |
| 443 | TCP | HTTPS |
| 443 | UDP | HTTP/3（可选，compose 已映射） |

**不要**放行 3000。

若系统有 `ufw`：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw --force enable
sudo ufw status
```

必须先允许 OpenSSH 再 enable，避免把自己锁在外面。

成功标准：安全组（以及 ufw 若启用）包含 22/80/443。

---

## 步骤 3 — DNS（必须在启动 Caddy 之前完成）

在域名 DNS 面板为 `coolxu.com` 设置：

| 类型 | 主机 | 值 |
|---|---|---|
| A | `@`（apex / `coolxu.com`） | 步骤 1 的 `VPS_IP` |

不要加 `www`。不要开代理。不要随便加 AAAA。

等到公网解析已指向本机再继续。在 VPS 上：

```bash
# 将 1.2.3.4 换成步骤 1 的 VPS_IP
getent ahostsv4 coolxu.com || true
dig +short A coolxu.com @1.1.1.1
dig +short A coolxu.com @8.8.8.8
```

成功标准：`coolxu.com` 的 A 记录等于 `VPS_IP`。TTL 未刷新则等待（可每 30 秒查一次，最多约 15 分钟）。**未指向本机不要进入步骤 7。**

---

## 步骤 4 — 安装 Docker 与 Compose 插件

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER"
docker --version
sudo docker compose version
```

当前 SSH 会话若尚未加入 `docker` 组，本清单后续 Docker 命令一律用 `sudo docker`。

成功标准：`sudo docker compose version` 有输出。构建需要出网（镜像与 `next/font/google`）。

---

## 步骤 5 — 克隆仓库，写入生产 `.env`

```bash
sudo mkdir -p /opt
if [ ! -d /opt/etblog/.git ]; then
  sudo git clone https://github.com/ET-coolxu/ETblog.git /opt/etblog \
    || sudo git clone git@github.com:ET-coolxu/ETblog.git /opt/etblog
fi
sudo chown -R "$USER":"$USER" /opt/etblog
cd /opt/etblog
git fetch origin
git checkout main || git checkout dev
git pull --ff-only
test -f docker-compose.yml
test -d app/admin
```

若 HTTPS clone 因私有仓库失败，改用 `GIT_SSH`（需已配置 deploy key）。若 `main` 缺 `app/admin`，`git checkout dev`。

生成密钥并写入 `.env`（覆盖已有 `.env` 前，若文件已存在且含非示例密码，不要覆盖，改为只检查 `SITE_URL` / `SITE_DOMAIN` 是否正确）：

```bash
cd /opt/etblog
if [ ! -f .env ] || grep -q 'change-me-to-a-long-random-string\|dev-only-change-me' .env 2>/dev/null; then
  SESSION_SECRET=$(openssl rand -hex 32)
  if [ -z "${ADMIN_PASSWORD:-}" ]; then
    ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | head -c 20)
  fi
  cat > .env << EOF
SITE_NAME="CoolXu's Blog"
AUTHOR_NAME=coolxu
SITE_URL=https://coolxu.com
ADMIN_USER=admin
ADMIN_PASSWORD=${ADMIN_PASSWORD}
SESSION_SECRET=${SESSION_SECRET}
SITE_DOMAIN=coolxu.com
CADDY_EMAIL=maxxubuly@gmail.com
EOF
fi
```

检查：

```bash
cd /opt/etblog
grep -E '^SITE_NAME=|^SITE_URL=|^SITE_DOMAIN=|^CADDY_EMAIL=' .env
```

成功标准：

- `SITE_NAME` 带双引号，值为 `CoolXu's Blog`
- `SITE_URL=https://coolxu.com`（无尾斜杠）
- `SITE_DOMAIN=coolxu.com`（无 `http://`）
- `CADDY_EMAIL=maxxubuly@gmail.com`（是邮箱，不是域名）
- `.env` 不在即将提交的 git 暂存区

把 `ADMIN_PASSWORD` 记在你的会话里，最后回报给人类。

---

## 步骤 6 — 数据目录权限（容器用户 uid 1001）

```bash
cd /opt/etblog
mkdir -p content public/uploads data
sudo chown -R 1001:1001 content public/uploads data
```

成功标准：`ls -ld content public/uploads data` 的属主 uid 为 `1001`。不要改这些目录里的 Markdown 正文内容。

---

## 步骤 7 — 启动（仅在 DNS 已指向本机之后）

再次确认解析：

```bash
dig +short A coolxu.com @1.1.1.1
```

等于 `VPS_IP` 才执行：

```bash
cd /opt/etblog
sudo docker compose up --build -d
sudo docker compose ps
```

构建可能需要若干分钟。成功标准：`app` 与 `caddy` 均为 running / healthy（无 Restarting 循环）。

看证书（不要无限 `logs -f`）：

```bash
sleep 20
sudo docker compose logs --tail=80 caddy
```

成功标准：日志出现证书申请/TLS 成功一类信息，而不是 `NXDOMAIN`、`tls: handshake` 循环失败、`could not get certificate`。若失败：回到步骤 2–3，不要反复 `compose up` 硬刷 Let's Encrypt（有速率限制）。

---

## 步骤 8 — HTTP 验收（在 VPS 上 curl）

```bash
curl -sI --max-time 20 http://coolxu.com | head -n 20
curl -sI --max-time 20 https://coolxu.com | head -n 20
curl -sI --max-time 20 https://coolxu.com/posts/unfinished-draft | head -n 20
curl -s --max-time 20 https://coolxu.com/sitemap.xml | head -n 40
curl -sI --max-time 20 https://coolxu.com/feed.xml | head -n 20
curl -sI --max-time 20 https://coolxu.com/admin | head -n 20
```

成功标准：

| 检查 | 期望 |
|---|---|
| `http://coolxu.com` | 跳转到 `https://coolxu.com`（301/302/308） |
| `https://coolxu.com` | 200；证书有效 |
| 页面含站名 | HTML 里能看到 `CoolXu's Blog` 或署名 `coolxu` |
| `/posts/unfinished-draft` | **404**（草稿不对访客公开） |
| `/sitemap.xml` | 200，URL 以 `https://coolxu.com` 开头 |
| `/feed.xml` | 200 |
| `/admin` | 200 或 302 到登录页，不是 500 |

不要用管理员 session 去「验收 PV」；那会不记数。PV 用未带后台 cookie 的请求打开一篇已发布正文即可。

---

## 步骤 9 — 回报人类（完成后必须说）

1. `VPS_IP`
2. 站点：https://coolxu.com
3. 后台：https://coolxu.com/admin （用户名 `admin`）
4. **本次写入的 `ADMIN_PASSWORD`**（只说一次）
5. 使用的 Git 分支与 `/opt/etblog` 的 `git rev-parse --short HEAD`
6. 步骤 8 各 URL 的 HTTP 状态
7. 未做项：文章未改、无 www、无 CDN

不要回报完整 `SESSION_SECRET`。提醒：备份时拷走 `content/`、`public/uploads/`、`data/`，不要依赖 Git 里的上传与统计库。

---

## 失败排查（只查这些）

| 现象 | 先查 |
|---|---|
| 证书失败 | `dig A coolxu.com` 是否等于本机 IP；安全组 80/443；是否开了 CDN 代理；`CADDY_EMAIL` 是否为邮箱 |
| 构建被杀 / OOM | `free -h`，加 swap 后重新 `docker compose up --build -d` |
| 后台保存/上传 Permission denied | `content`、`public/uploads`、`data` 是否 uid 1001 |
| 打开站点仍是旧站名 | 日常看 Actions 是否把 `SITE_NAME` 等 ARG 打进镜像；**只 recreate 不够**。应急才在 VPS `up --build` |
| robots/sitemap 仍是 localhost | 同上：构建期 `SITE_URL` 必须是 `https://coolxu.com` |
| Actions 绿勾但线上没动 | 是否只合入了 `test`（构建绿、部署 job 跳过是预期）；部署 job 是否因缺 Secrets 失败；VPS 能否 `docker login ghcr.io` |
| GHCR pull 拒绝 | `GHCR_PULL_TOKEN` 是否有 `read:packages`；镜像名是否小写 `ghcr.io/et-coolxu/etblog` |
| 登录 cookie 异常 | `SITE_URL` 必须以 `https://` 开头 |
| git clone 失败 | 仓库是否私有；改 SSH deploy key |

---

## 日常更新（GHCR，优先）

人类把改动经 PR 合入 GitHub **`test`**，确认 Actions 里 Docker / `next build` 通过后，再把 `test` 合入 **`main`**（推荐走 PR）。也可在仓库 Actions 里对 **`main`** 手动 **Run workflow**（工作流名：Deploy to GHCR and VPS）。push 到 `test` 只会构建，**不会** SSH。未合入 `main` 的改动不会上线。

助手**不要**默认在 VPS 执行 `git pull` 再 `--build`。那会在小内存机器上 `next build`，容易 OOM，也会用 Git 碰到 `content/`。

VPS 侧由 Actions SSH 调用 `scripts/vps-deploy-from-ghcr.sh`：登录 GHCR → 只 checkout 该 SHA 的 `docker-compose.yml` / `Caddyfile` / 该脚本 → `docker compose pull app` → `up -d --no-build`。应用代码来自镜像；运行时仍读本机 `.env`。

### 首次启用 GHCR（一次性，人类在 GitHub 填 Secrets）

仓库 Settings → Secrets and variables → Actions：

| 类型 | 名 | 值 |
|---|---|---|
| Secret | `VPS_HOST` | `117.55.235.105` 或 `coolxu.com` |
| Secret | `VPS_USER` | 现为 `root` |
| Secret | `VPS_SSH_KEY` | Actions **专用**私钥 |
| Secret | `GHCR_PULL_TOKEN` | 能 `read:packages` 的 PAT |
| Variable（可选） | `SITE_NAME`、`AUTHOR_NAME`、`SITE_URL` | 缺省 `CoolXu's Blog` / `coolxu` / `https://coolxu.com` |

VPS：把对应公钥写入 `~/.ssh/authorized_keys`（不要把登录密码写进仓库）。确认要上线的提交已先在 `test` 验证、再合入 `main`。`/opt/etblog` 仍需能 `git fetch`（只取 compose/Caddy，不是为了同步文章）。宿主机 HEAD 看起来像旧 `test` 没关系，应用以 GHCR 镜像为准。

回滚：在 VPS 上对旧 SHA 跑同一脚本（`IMAGE_TAG=<旧 sha> GHCR_PULL_TOKEN=... bash scripts/vps-deploy-from-ghcr.sh`），或在 Actions 对旧 commit 手动 Run（若该 SHA 的镜像还在 GHCR）。

### 应急（Actions 不可用时才在 VPS 构建）

仍不要改 `content/` 里未打算发布的稿，不要 `down -v`，不要映射 3000，不要 `git reset --hard`：

```bash
cd /opt/etblog
git fetch origin
# 若只要 compose 定义：git checkout origin/main -- docker-compose.yml Caddyfile
sudo docker compose up --build -d
```

OOM 时先加 swap（见步骤 1）。首页站名在 **镜像构建** 时写入；只 `up -d --force-recreate` 不够。

---

## 步骤 10 — 已上线站点：重建以写入站名

若 GHCR 工作流已启用：把含 Dockerfile ARG 的提交经 `test` 验证后合入 `main`（或对 `main` 手动 Run），确认 Actions 构建参数是 `CoolXu's Blog` / `coolxu` / `https://coolxu.com`。不要在 VPS `reset --hard`。

首次部署若首页仍是「个人博客」、页脚是「作者」、`/robots.txt` 里 sitemap 是 `http://localhost:3000/...`，且 Actions 还不可用，再按下面在 VPS 应急重建。不要改文章。

```bash
cd /opt/etblog
# 应急重建不要整库 pull，以免覆盖 content/
grep -E '^SITE_NAME=|^AUTHOR_NAME=|^SITE_URL=' .env
```

`.env` 必须仍是：

```bash
SITE_NAME="CoolXu's Blog"
AUTHOR_NAME=coolxu
SITE_URL=https://coolxu.com
```

然后重建应用镜像（Caddy 证书卷不要 `down -v`）：

```bash
cd /opt/etblog
sudo docker compose up --build -d
```

成功标准（在 VPS 上 curl，或让人类刷新首页并强制跳过缓存）：

```bash
curl -s https://coolxu.com/ | grep -o '<title>[^<]*</title>'
curl -s https://coolxu.com/robots.txt
curl -sI https://coolxu.com/about | head -n 5
```

- 首页 `<title>` 为 `CoolXu's Blog`（不是「个人博客」）
- 页脚或正文可见 `coolxu`（不是单独一个「作者」）
- `robots.txt` 的 Sitemap 为 `https://coolxu.com/sitemap.xml`
- 关于页文档标题含 `CoolXu's Blog`

---

## 停止（保留数据卷与绑定目录）

```bash
cd /opt/etblog
sudo docker compose down
```
