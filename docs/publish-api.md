# Publish API

机器发文接口。文章仍只写在 `content/posts/{slug}.md`，规则与后台相同。网页登录用的 cookie 不能调用这里。

## Token

在运行环境设置 `PUBLISH_API_TOKEN`（长随机串，与 `ADMIN_PASSWORD`、`SESSION_SECRET` 分开）。留空则下面的接口一律 `401`。

本地写在 `.env.local`，生产写在 VPS 的 `.env`。Compose 已用 `env_file` 注入，不要把它做成镜像构建参数，不要提交 Git。

请求头：

```http
Authorization: Bearer <PUBLISH_API_TOKEN>
```

未配置、缺失或错误都是：

```json
{ "ok": false, "error": "unauthorized" }
```

HTTP `401`。

## 端点

前缀 `/api/v1/posts`。

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/v1/posts` | 新建 |
| `GET` | `/api/v1/posts` | 列表，含草稿与存档 |
| `GET` | `/api/v1/posts/{slug}` | 读取一篇，含正文 |
| `PATCH` | `/api/v1/posts/{slug}` | 部分更新 |

列表可用 `?status=published`、`draft` 或 `archived`。缺省为全部。其他取值返回 `400`。

### 新建

必填：`slugHand`、`title`、`intent`（`draft`、`publish`、`archive`）。

可选：`date`、`tags`、`summary`、`cover`、`featured`、`body`。

不要传 `slug`。服务端会把 `slugHand` 加成 `{手填}-{序号}`，例如 `ai-digest` 变成 `ai-digest-12`。

省略 `date` 时用 `Asia/Shanghai` 的当天 `YYYY-MM-DD`。

### 更新

路径里的 slug 是文件名，创建后不可改。正文里再带别的 `slug` 或 `slugHand` 会 `400`。

只提交要改的字段。省略 `intent` 则保持当前状态。已存档不能直接 `publish`，须先改为 `draft`。草稿不能 `archive`。

### 响应

写成功：

```json
{ "ok": true, "slug": "ai-digest-12", "status": "published", "url": "/posts/ai-digest-12" }
```

`url` 是站内路径。失败正文为 `{ "ok": false, "error": "中文原因" }`。`400` 是字段或状态机错误，`404` 是文章不存在，`409` 是 slug 冲突。非法 slug 是 `400`。

列表项不含正文。读取结果里的 `summary` 在 frontmatter 没写摘要时，可能是正文摘录；更新时若不提交 `summary`，不会把这段摘录写回文件。

封面为站内路径或 `https://` 地址。

## curl

把 `TOKEN` 换成你自己的值。下面的命令会在本地新建一篇已发布文章。

```bash
curl -sS http://localhost:3000/api/v1/posts \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"slugHand\":\"ai-digest\",\"title\":\"资讯速览\",\"intent\":\"publish\",\"tags\":[\"资讯\"],\"body\":\"## 1. 示例\n\n- 原链：<https://example.com>\n\"}"
```

列出已发布：

```bash
curl -sS "http://localhost:3000/api/v1/posts?status=published" \
  -H "Authorization: Bearer TOKEN"
```

本机 MCP 的配置见 `mcp/coolxu-blog/README.md`。
