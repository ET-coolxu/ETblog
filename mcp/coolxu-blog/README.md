# CoolXu Blog MCP

本机 stdio 进程，把工具调用转到博客的 Publish API。不直接写 `content/posts/`。

契约见仓库 `docs/publish-api.md`。

## 准备

在本目录执行：

```bash
npm install
npm run build
```

应用侧要已配置 `PUBLISH_API_TOKEN`。这里的 `COOLXU_BLOG_TOKEN` 填同一个值，不要写进 Git。

## Cursor

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

线上把 `COOLXU_BLOG_BASE_URL` 改成站点根地址，例如 `https://coolxu.com`。不要在末尾加斜杠也没关系，客户端会去掉。

## 工具

| 工具 | 必填 | 说明 |
|---|---|---|
| `list_posts` | 无 | 可选 `status`：`published`、`draft`、`archived` |
| `get_post` | `slug` | 完整 slug，含正文 |
| `create_post` | `slugHand`、`title`、`intent` | 服务端追加序号。发布用 `intent: "publish"` |
| `update_post` | `slug` | 只改提交的字段 |

这个包不进应用镜像。根目录没有把它配成 npm workspace。
