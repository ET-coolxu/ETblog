import "server-only";
import FlexSearch from "flexsearch";
import {
  listPublishedPostContents,
  plainTextFromMarkdown,
  type PostMeta,
} from "@/lib/posts";

type IndexedPost = {
  slug: string;
  title: string;
  summary: string;
  body: string;
};

const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

export function tokenizeForSearch(input: string): string[] {
  const text = input.normalize("NFKC").toLowerCase();
  const tokens: string[] = [];
  const latin = text.match(/[a-z0-9]+/g);
  if (latin) {
    tokens.push(...latin);
  }

  const cjk: string[] = [];
  for (const char of text) {
    if (CJK.test(char)) {
      cjk.push(char);
    }
  }

  for (let i = 0; i < cjk.length; i += 1) {
    tokens.push(cjk[i]);
    if (i + 1 < cjk.length) {
      tokens.push(`${cjk[i]}${cjk[i + 1]}`);
    }
  }

  return tokens;
}

function toSearchable(text: string): string {
  return tokenizeForSearch(text).join(" ");
}

function collectSlugs(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const slugs: string[] = [];
  const seen = new Set<string>();
  const push = (value: unknown) => {
    const slug = String(value);
    if (!slug || seen.has(slug)) {
      return;
    }
    seen.add(slug);
    slugs.push(slug);
  };

  for (const item of raw) {
    if (typeof item === "string" || typeof item === "number") {
      push(item);
      continue;
    }

    if (item && typeof item === "object" && "result" in item) {
      const result = (item as { result: unknown }).result;
      if (Array.isArray(result)) {
        for (const id of result) {
          push(id);
        }
      }
    }
  }

  return slugs;
}

export async function searchPublishedPosts(query: string): Promise<PostMeta[]> {
  const keyword = query.trim();
  const searchable = toSearchable(keyword);
  if (!keyword || !searchable) {
    return [];
  }

  const posts = await listPublishedPostContents();
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  const index = new FlexSearch.Document<IndexedPost>({
    tokenize: "strict",
    document: {
      id: "slug",
      index: ["title", "summary", "body"],
    },
  });

  for (const post of posts) {
    index.add({
      slug: post.slug,
      title: toSearchable(post.title),
      summary: toSearchable(post.summary),
      body: toSearchable(plainTextFromMarkdown(post.body)),
    });
  }

  const slugs = collectSlugs(index.search(searchable, { limit: 50, bool: "or" }));

  return slugs.flatMap((slug) => {
    const post = bySlug.get(slug);
    if (!post) {
      return [];
    }

    const { body: _body, ...meta } = post;
    return [meta];
  });
}
