import { compileMDX } from "next-mdx-remote/rsc";
import type { ReactElement } from "react";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import remarkGfm from "remark-gfm";
import { remark } from "remark";
import type { Heading, Root } from "mdast";
import { visit } from "unist-util-visit";
import GithubSlugger from "github-slugger";
import { MarkdownImage } from "@/components/markdown-image";

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

export async function renderMarkdown(source: string): Promise<ReactElement> {
  const { content } = await compileMDX({
    source,
    components: {
      img: MarkdownImage,
    },
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
          [
            rehypeShiki,
            {
              theme: "vitesse-light",
              defaultLanguage: "text",
            },
          ],
        ],
      },
    },
  });

  return content;
}
