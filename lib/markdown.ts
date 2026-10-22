import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import { remark } from "remark";
import type { Heading, Root } from "mdast";
import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";
import { MarkdownImage } from "@/components/markdown-image";

/**
 * 正文和后台预览共用这一份，避免两处各建一次高亮器，或因配置不一致而重建。
 * 不传 langs 时 @shikijs/rehype 会载入 Shiki 全部语言；这里只预载常用语言，其余靠 lazy 按需加载。
 * bash 与 shell 不是独立语法 id，而是 shellscript 的别名；bundledLanguages 含这两个键，高亮器接受。
 */
const shikiOptions: RehypeShikiOptions = {
  theme: "vitesse-light",
  defaultLanguage: "text",
  fallbackLanguage: "text",
  lazy: true,
  langs: [
    "typescript",
    "tsx",
    "javascript",
    "jsx",
    "bash",
    "shell",
    "json",
    "css",
    "html",
    "markdown",
    "yaml",
    "python",
    "sql",
    "diff",
  ],
};

export type TocItem = {
  id: string;
  text: string;
  depth: 2 | 3;
};

function toPlainText(node: Heading): string {
  const parts: string[] = [];

  visit(node, (child) => {
    if ("value" in child && typeof child.value === "string") {
      parts.push(child.value);
    }
  });

  return parts.join("").trim();
}

export function extractToc(markdown: string): TocItem[] {
  const tree = remark().parse(markdown) as Root;
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];

  visit(tree, "heading", (node: Heading) => {
    if (node.depth !== 2 && node.depth !== 3) {
      return;
    }

    const text = toPlainText(node);
    if (!text) {
      return;
    }

    items.push({
      id: slugger.slug(text),
      text,
      depth: node.depth,
    });
  });

  return items;
}

/**
 * 把 Markdown 编译成正文 React 节点。代码高亮与后台预览共用 `shikiOptions`。
 */
export async function renderMarkdown(source: string): Promise<ReactElement> {
  const { content } = await compileMDX({
    source,
    components: {
      img: MarkdownImage,
    },
    // v6 起默认去掉 `{表达式}`。文章是 Markdown，保持这个默认。
    options: {
      mdxOptions: {
        format: "md",
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "wrap",
              properties: { className: "heading-anchor" },
            },
          ],
          [rehypeShiki, shikiOptions],
        ],
      },
    },
  });

  return content;
}

export async function renderMarkdownToHtml(source: string): Promise<string> {
  const file = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(source);

  return String(file);
}

/**
 * 把 Markdown 渲染成后台预览 HTML。代码高亮与正文共用 `shikiOptions`。
 */
export async function renderMarkdownPreviewHtml(source: string): Promise<string> {
  const file = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeShiki, shikiOptions)
    .use(rehypeStringify)
    .process(source);

  return String(file);
}
