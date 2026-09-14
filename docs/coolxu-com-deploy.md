# coolxu.com 部署记录（ETblog）

> 整理自 2026-09-11 实操：在 CloudCone VPS 上完成 Docker + Caddy 部署。  
> 仓库清单原稿：`docs/vps-go-live.md`（`test` 分支）。本文记录**实际做过的事**与环境差异，便于复盘与日常运维。

---

## 1. 当前线上状态

| 项 | 值 |
|---|---|
| 站点 | https://coolxu.com |
| 后台 | https://coolxu.com/admin （用户 `admin`） |
| 公网 IPv4 | `117.55.235.105` |
| VPS 名称（面板） | `www.coolxu.com` |
| 云厂商 | CloudCone（https://app.cloudcone.com） |
| 域名注册商 / DNS | 西部数码（West.cn / myhostadmin） |
| 系统 | AlmaLinux 8.9 x86_64 |
| 应用目录 | `/opt/etblog` |
| Git | `https://github.com/ET-coolxu/ETblog.git`，分支 **`test`**，当时 HEAD **`8a5ed36`** |
| 反向代理 / TLS | Caddy 2（容器），Let's Encrypt |
| 应用 | Next.js 容器 `etblog-app`（对内 3000，**不对公网映射 3000**） |

验收（上线时）：

- `http://coolxu.com` → **308** 到 HTTPS  
- `https://coolxu.com` → **200**，证书有效  
- `/posts/unfinished-draft` → **404**（草稿不公开，符合预期）  
- `/sitemap.xml`、`/feed.xml` → **200**  
- `/admin` → **307** 到 `/admin/login`

---

## 2. 架构简述

```
用户 → coolxu.com (A: 117.55.235.105)
         → 宿主机 :80/:443 (Caddy 容器)
              → 反代到 app 容器 :3000
              → 自动申请/续期 Let's Encrypt 证书
```

数据在宿主机绑定目录（勿依赖 Git 里的上传与统计）：

- `content/` — Markdown 内容  
- `public/uploads/` — 上传文件  
- `data/` — 运行时数据（如统计库）  
- `.env` — 生产密钥（**不进 Git**）

容器内进程用户 uid **1001**，上述目录需属主 `1001:1001`。

---

## 3. 账号与入口（运维备忘）

| 用途 | 说明 |
|---|---|
| CloudCone 面板 | https://app.cloudcone.com — 查实例、公网 IP、控制台 |
| SSH | `ssh root@117.55.235.105 -p 22`（密码在面板标注「发到邮箱」；本次用已有 root 密码登录） |
| 西部数码 | https://www.west.cn — 域名 / DNS（权威 NS：`ns*.myhostadmin.net`） |
| 博客后台 | https://coolxu.com/admin ，用户 `admin`；密码在 VPS `/opt/etblog/.env` 的 `ADMIN_PASSWORD`（上线时已单独告知一次） |

**安全注意**

- 不要把 root 密码、`.env`、`SESSION_SECRET` 提交到仓库或发到公开群。  
- CloudCone 面板登录可能遇验证码；西部数码从海外 IP 改解析可能要求「人脸增强实名」，需本人在国内完成或本机改 DNS。

---

## 4. 本次实操步骤（按时间线）

### 4.1 拿到机器与 SSH

1. 登录 CloudCone，确认 Budget VPS：`www.coolxu.com`，状态 ACTIVE。  
2. 记录 IPv4：`117.55.235.105`，SSH：`root@117.55.235.105:22`。  
3. 面板无独立「安全组」控件可改；主机上当时也无 `firewalld`/`ufw`。SSH 已通；80/443 上线后实测可访问。  
4. 用 root 密码完成首次 SSH。

主机概况（当时）：

- 内存约 1.9 GiB，已有 1 GiB swap  
- 磁盘约 119G，可用充足  

### 4.2 DNS（关键路径）

1. 权威 NS 在 **西部数码 / myhostadmin**，**不是** CloudCone DNS。  
   - 在 CloudCone Domains 里加的 A 记录**不会**对外生效。  
2. 原 A 记录：`coolxu.com` / `www` / `blog` → `142.171.9.117`（旧站）。  
3. 在西部数码将 apex `@`（及本次一并改动的 `www`）A 记录改为 **`117.55.235.105`**。  
4. 用公共解析确认后再启动 Caddy：

```bash
dig +short A coolxu.com @1.1.1.1
dig +short A coolxu.com @8.8.8.8
# 期望：117.55.235.105
```

**上线原则（与原稿一致）：DNS 未指向本机前，不要 `docker compose up`，避免 Let's Encrypt 失败与速率限制。**

### 4.3 系统软件（AlmaLinux 差异）

原稿按 Ubuntu/`apt` 写。本机是 **AlmaLinux 8.9**，实际做法：

```bash
dnf -y install ca-certificates curl git
# get.docker.com 会报 Unsupported distribution 'almalinux'
# 改用官方 Docker CE 的 CentOS 源安装（与 RHEL 系常用方式一致）
# 安装 docker-ce、docker-ce-cli、containerd.io、docker-compose-plugin
systemctl enable --now docker
docker --version          # 当时 26.1.3
docker compose version    # 当时 v2.27.0
```

未启用 firewalld/ufw；若日后开启防火墙，需放行：

| 端口 | 协议 | 用途 |
|---|---|---|
| 22 | TCP | SSH |
| 80 | TCP | HTTP / ACME |
| 443 | TCP | HTTPS |
| 443 | UDP | HTTP/3（可选） |

**不要**对公网开放 3000。

### 4.4 克隆仓库与 `.env`

```bash
sudo mkdir -p /opt
sudo git clone https://github.com/ET-coolxu/ETblog.git /opt/etblog
cd /opt/etblog
git fetch origin
git checkout test    # 本次使用 test（含 docker-compose.yml 与 app/admin）
git pull --ff-only
```

生成并写入生产 `.env`（示例结构；密钥以服务器上文件为准）：

```bash
SITE_NAME="CoolXu's Blog"
AUTHOR_NAME=coolxu
SITE_URL=https://coolxu.com
ADMIN_USER=admin
ADMIN_PASSWORD=<随机强密码>
SESSION_SECRET=<openssl rand -hex 32>
SITE_DOMAIN=coolxu.com
CADDY_EMAIL=maxxubuly@gmail.com
```

校验要点：

- `SITE_NAME` 带双引号  
- `SITE_URL` 为 `https://coolxu.com`（无尾斜杠）  
- `SITE_DOMAIN` 为 `coolxu.com`  
- `CADDY_EMAIL` 是邮箱  
- `.env` 永不 `git add`

### 4.5 数据目录权限

```bash
cd /opt/etblog
mkdir -p content public/uploads data
chown -R 1001:1001 content public/uploads data
```

### 4.6 启动与证书

DNS 已指向本机后：

```bash
cd /opt/etblog
docker compose up --build -d
docker compose ps
# 等待约 20s 后查看证书日志
docker compose logs --tail=80 caddy
```

期望：Caddy 日志出现 ACME/证书成功；`app` 与 `caddy` 均为 Up，无 Restarting 循环。

### 4.7 HTTP 验收命令（可复查）

```bash
curl -sI --max-time 20 http://coolxu.com | head -n 20
curl -sI --max-time 20 https://coolxu.com | head -n 20
curl -sI --max-time 20 https://coolxu.com/posts/unfinished-draft | head -n 20
curl -s --max-time 20 https://coolxu.com/sitemap.xml | head -n 40
curl -sI --max-time 20 https://coolxu.com/feed.xml | head -n 20
curl -sI --max-time 20 https://coolxu.com/admin | head -n 20
```

---

## 5. 日常运维

### 更新代码

```bash
cd /opt/etblog
git pull --ff-only
docker compose up --build -d
```

仍不要随意改 `content/` 里未打算发布的稿；不要 `docker compose down -v`（会删 Caddy 证书卷）。

### 停止（保留数据）

```bash
cd /opt/etblog
docker compose down
```

### 备份

拷走并异地保存：

- `content/`  
- `public/uploads/`  
- `data/`  
- （可选）`.env` 到私密位置  

### 查看日志

```bash
cd /opt/etblog
docker compose logs --tail=100 app
docker compose logs --tail=100 caddy
```

---

## 6. 已知备注（上线时观察到的）

1. **页面标题**当时显示「个人博客」，与 `.env` 里 `SITE_NAME="CoolXu's Blog"` 字面不完全一致——可能与构建/前端文案来源有关，未改应用代码。  
2. **部分 meta / RSS** 中曾出现 `http://localhost:3000/...` 迹象，疑为构建期未吃到生产 `SITE_URL`；站点主入口与 TLS 正常。若要修，应在不改 `content/` 正文的前提下查 compose 构建参数 / 环境变量是否在 build 阶段传入。  
3. 域名 **不上 CDN、不上 Cloudflare 橙色云代理**（原稿要求）；只上线 apex `coolxu.com` 为主。`www` 本次 DNS 也指向了同一 IP，但清单默认不强调 www。

---

## 7. 与原稿 `docs/vps-go-live.md` 的差异摘要

| 原稿假设 | 本次实际 |
|---|---|
| Ubuntu/Debian + `apt` | AlmaLinux 8.9 + `dnf` |
| `get.docker.com` 一键装 | AlmaLinux 被脚本拒绝 → Docker CE CentOS 源 |
| `ufw` | 未使用；面板亦无安全组 UI |
| Git 优先 `main`/`dev` | 使用 **`test`** |
| DNS 任意可改面板 | 必须在 **西部数码** 改；CloudCone DNS 区无效 |
| 海外助手直接改西数 DNS | 可能触发人脸增强实名 → 需本人改 |

禁止项仍适用：不改 `content/posts|pages` 正文、不改 `Caddyfile`/`docker-compose.yml`/`Dockerfile`（除非你另行授权）、不把 3000 暴露公网、不把生产密码写回仓库。

---

## 8. 故障速查

| 现象 | 先查 |
|---|---|
| 证书失败 | `dig A coolxu.com` 是否等于本机 IP；80/443 是否通；是否开了 CDN 代理；`CADDY_EMAIL` 是否为邮箱 |
| 构建 OOM | `free -h`，加/用 swap 后重新 `docker compose up --build -d` |
| 后台保存/上传 Permission denied | `content`、`public/uploads`、`data` 是否 uid 1001 |
| 站名/URL 仍像本地 | `.env` 的 `SITE_URL`/`SITE_NAME`；是否需重建镜像使 build-arg/env 生效 |
| SSH 不上 | CloudCone 实例状态、root 密码/密钥、22 端口 |

---

## 9. 相关链接

- 站点：https://coolxu.com  
- 仓库：https://github.com/ET-coolxu/ETblog  
- 上线清单（仓库内）：`docs/vps-go-live.md`  
- CloudCone：https://app.cloudcone.com  
- 西部数码：https://www.west.cn  

---

*文档生成说明：根据 2026-09-11 助手实操整理，供所有者留存；密钥以服务器 `.env` 与你本地保管为准。*
