# CoolXu Blog MCP

用来让 AI 列出、读取、新建和更新博客文章。文章仍写在站点的 `content/posts/`，规则与 Publish API 相同。契约见 `docs/publish-api.md`。

两种接法用的是同一组工具、同一个 `PUBLISH_API_TOKEN`：

- **远程 HTTP**：客户端只填地址。不能启动本地进程的 AI 用这个。本机开发时也可以用，只要站点在跑。
- **本机 stdio**：Cursor 启动本目录编译出的进程，再由进程去请求 Publish API。

## 远程 HTTP

站点需已配置 `PUBLISH_API_TOKEN`。本地开发时先运行 `npm run dev`。部署后把地址换成线上站点。

`type` 为 `http` 表示 Streamable HTTP。Token 放在 `headers` 里，不要写进 Git。Cursor 会把 `${env:变量名}` 换成环境变量。

本地：

```json
{
  "mcpServers": {
    "coolxu-blog": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "Authorization": "Bearer ${env:PUBLISH_API_TOKEN}"
      }
    }
  }
}
```

线上把 `url` 换成 `https://coolxu.com/api/mcp`，环境变量换成服务器上的那个 token。没有环境变量时，可以把 `Bearer` 后面直接写成 token，但不要提交这个文件。

这种接法不用安装本目录，也不用 `npm run build`。

## 本机 stdio

在本目录执行：

```bash
npm install
npm run build
```

`COOLXU_BLOG_TOKEN` 与 `PUBLISH_API_TOKEN` 填同一个值。

```json
{
  "mcpServers": {
    "coolxu-blog": {
      "command": "node",
      "args": ["<仓库>/mcp/coolxu-blog/dist/index.js"],
      "env": {
        "COOLXU_BLOG_BASE_URL": "http://localhost:3000",
        "COOLXU_BLOG_TOKEN": "<与 PUBLISH_API_TOKEN 相同>"
      }
    }
  }
}
```

线上把 `COOLXU_BLOG_BASE_URL` 改成站点根地址，例如 `https://coolxu.com`。末尾有没有斜杠都可以。

这个包不进应用镜像。根目录没有把它配成 npm workspace。

## 工具

远程和本机 stdio 都是这四个：

| 工具 | 必填 | 说明 |
|---|---|---|
| `list_posts` | 无 | 可选 `status`：`published`、`draft`、`archived` |
| `get_post` | `slug` | 完整 slug，含正文 |
| `create_post` | `slugHand`、`title`、`intent` | 服务端追加序号。发布用 `intent: "publish"` |
| `update_post` | `slug` | 只改提交的字段 |
