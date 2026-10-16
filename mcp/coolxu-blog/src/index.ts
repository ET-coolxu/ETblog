/**
 * CoolXu Blog 的 stdio MCP。工具只调用 Publish API，不直接写文章文件。
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createPost, getPost, listPosts, updatePost } from "./client.js";

const server = new McpServer({
  name: "coolxu-blog",
  version: "0.1.0",
});

function textResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : "请求失败";
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

server.registerTool(
  "list_posts",
  {
    description: "列出博客文章，含草稿与存档。可选 status：published、draft、archived。",
    inputSchema: {
      status: z.enum(["published", "draft", "archived"]).optional(),
    },
  },
  async ({ status }) => {
    try {
      return textResult(await listPosts(status));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "get_post",
  {
    description: "按完整 slug 读取一篇文章，含正文。必填：slug。",
    inputSchema: {
      slug: z.string().describe("完整 slug，例如 ai-digest-12"),
    },
  },
  async ({ slug }) => {
    try {
      return textResult(await getPost(slug));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "create_post",
  {
    description:
      "新建文章。必填：slugHand、title、intent（draft、publish 或 archive）。服务端把 slugHand 加成「手填-序号」，不要自己加序号。发布用 intent=publish。",
    inputSchema: {
      slugHand: z.string().describe("手填 slug，仅小写字母、数字和连字符"),
      title: z.string(),
      intent: z.enum(["draft", "publish", "archive"]),
      date: z.string().optional().describe("YYYY-MM-DD，省略则用上海当天"),
      tags: z.array(z.string()).optional(),
      summary: z.string().optional(),
      cover: z.string().optional().describe("站内路径或 https 地址"),
      featured: z.boolean().optional(),
      body: z.string().optional().describe("Markdown 正文"),
    },
  },
  async (input) => {
    try {
      return textResult(await createPost(input));
    } catch (error) {
      return errorResult(error);
    }
  },
);

server.registerTool(
  "update_post",
  {
    description:
      "按完整 slug 部分更新文章。必填：slug。其余字段省略则保持原值。发布用 intent=publish；已存档不能直接发布。",
    inputSchema: {
      slug: z.string().describe("完整 slug，创建后不可改"),
      title: z.string().optional(),
      intent: z.enum(["draft", "publish", "archive"]).optional(),
      date: z.string().optional(),
      tags: z.array(z.string()).optional(),
      summary: z.string().optional(),
      cover: z.string().optional(),
      featured: z.boolean().optional(),
      body: z.string().optional(),
    },
  },
  async (input) => {
    try {
      return textResult(await updatePost(input));
    } catch (error) {
      return errorResult(error);
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
