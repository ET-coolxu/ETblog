# ET blog

可自托管的个人博客。第一版按 [docs/todo-v1.md](docs/todo-v1.md) 分阶段实现；产品说明见 [docs/requirements/v1.md](docs/requirements/v1.md)。

对着本仓库学 Next.js：[docs/项目说明](docs/项目说明/README.md)。

当前已完成公开阅读：首页、文章列表、正文、标签和关于页。搜索、暗色模式和后台仍待后续阶段。

## 本地开发

需要 Node.js 20 或以上。

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。站名、作者来自 `.env.local` 里的 `SITE_NAME`、`AUTHOR_NAME`。

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

停止：

```powershell
docker compose down
```

## 当前缺口

- 没有 `package-lock.json` 时，Docker 构建会退回 `npm install`，可复现性较差。本地先跑一次 `npm install` 再构建更稳。
- 本机 Compose 若没有公网域名，Caddy **不会**签发 Let's Encrypt 证书；`localhost` 走 HTTP :80。
- Linux VPS 上若写入 `public/uploads` 或 `data` 报权限错误，把这两个目录的属主改成容器用户（镜像里是 uid `1001`）。
- SQLite、搜索、后台登录都还没实现。

## 目录

```
app/(site)/     公开站点布局与占位首页
app/admin/      后台目录预留（占位页）
content/posts/  文章 Markdown（后续阶段）
content/pages/  关于页等
public/uploads/ 文章图片
data/           SQLite 预留
lib/            站点配置等
```
