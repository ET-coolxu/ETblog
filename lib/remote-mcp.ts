/**
 * 远程 MCP 的工具定义。跑在站点进程里，直接读写文章，不再请求本机 HTTP。
 */
import "server-only";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  failureFromSaveError,
  inputForCreate,
  inputForUpdate,
  isPublishStatus,
  statusFromIntent,
  toDetail,
  toListItem,
  toWriteSuccess,
} from "@/lib/publish-posts";
import {
  getAdminPost,
  isValidSlug,
  listAdminPosts,
  readStoredSummary,
  savePost,
} from "@/lib/posts";
import { mergePostTags, revalidatePostSurfaces } from "@/lib/revalidate-posts";

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

function definedFields(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}

/**
 * 建一个带四个发文工具的 MCP server。
 * 每次 HTTP 请求新建一个，不在进程里保存会话。
 */
export function createBlogMcpServer(): McpServer {
  const server = new McpServer({
    name: "coolxu-blog",
    version: "0.1.0",
  });

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
        if (status !== undefined && !isPublishStatus(status)) {
          return errorResult("status 只能是 published、draft 或 archived。");
        }
        const posts = await listAdminPosts();
        const items = posts
          .map(toListItem)
          .filter((post) => status === undefined || post.status === status);
        return textResult({ ok: true, posts: items });
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
        if (!isValidSlug(slug)) {
          return errorResult("slug 不合法。");
        }
        const post = await getAdminPost(slug);
        if (!post) {
          return errorResult("找不到这篇文章。");
        }
        return textResult({ ok: true, post: toDetail(post) });
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
        const parsed = inputForCreate(
          definedFields({
            slugHand: input.slugHand,
            title: input.title,
            intent: input.intent,
            date: input.date,
            tags: input.tags,
            summary: input.summary,
            cover: input.cover,
            featured: input.featured,
            body: input.body,
          }),
        );
        if (!parsed.ok) {
          return errorResult(parsed.error);
        }
        const saved = await savePost(parsed.input, "create");
        if (!saved.ok) {
          return errorResult(failureFromSaveError(saved.error).error);
        }
        revalidatePostSurfaces(saved.slug, parsed.input.tags);
        return textResult(toWriteSuccess(saved.slug, statusFromIntent(parsed.input.intent)));
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
        if (!isValidSlug(input.slug)) {
          return errorResult("slug 不合法。");
        }
        const current = await getAdminPost(input.slug);
        if (!current) {
          return errorResult("找不到这篇文章。");
        }
        const storedSummary = (await readStoredSummary(input.slug)) ?? "";
        const parsed = inputForUpdate(
          input.slug,
          current,
          storedSummary,
          definedFields({
            title: input.title,
            intent: input.intent,
            date: input.date,
            tags: input.tags,
            summary: input.summary,
            cover: input.cover,
            featured: input.featured,
            body: input.body,
          }),
        );
        if (!parsed.ok) {
          return errorResult(parsed.error);
        }
        const saved = await savePost(parsed.input, "update");
        if (!saved.ok) {
          return errorResult(failureFromSaveError(saved.error).error);
        }
        revalidatePostSurfaces(saved.slug, mergePostTags(current.tags, parsed.input.tags));
        return textResult(toWriteSuccess(saved.slug, statusFromIntent(parsed.input.intent)));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  return server;
}
