import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isPublishAuthorized } from "@/lib/publish-auth";
import { createBlogMcpServer } from "@/lib/remote-mcp";

export const runtime = "nodejs";

/** 工具读的是磁盘上的文章，不能在构建时把 MCP 会话定格下来。 */
export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/**
 * 远程 MCP（Streamable HTTP）。
 * 每个请求单独建 server，不保存会话；POST 用 JSON 回应，避免代理把 SSE 缓冲住。
 * GET 是协议里的通知流，返回后不能立刻关掉。
 */
async function handle(request: Request): Promise<Response> {
  if (!isPublishAuthorized(request.headers.get("authorization"))) {
    return unauthorized();
  }

  const server = createBlogMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);

  try {
    const response = await transport.handleRequest(request);
    if (request.method !== "GET") {
      await server.close();
    }
    return response;
  } catch (error) {
    await server.close();
    throw error;
  }
}

export { handle as GET, handle as POST, handle as DELETE };
