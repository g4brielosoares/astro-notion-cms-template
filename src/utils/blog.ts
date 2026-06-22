import { getCollection, type CollectionEntry } from "astro:content";
import slugify from "slugify";

export type BlogPost = CollectionEntry<"notion">;

export interface BlogPostData {
  title: string;
  slug: string;
  description?: string;
  status: string;
  author?: string;
  tags: string[];
  createdTime: Date;
  lastEditedTime?: Date;
  cover?: BlogPost["data"]["cover"] | null;
  coverAlt?: string;
}

export interface TagArchive {
  name: string;
  slug: string;
  posts: BlogPost[];
}

const blogFields = {
  status: "status",
  author: "author",
  tags: "tags",
  description: ["description", "excerpt", "resumo"],
  createdTime: ["createdTime", "dataDePublicacao"],
  lastEditedTime: ["lastEditedTime", "ultimaEdicao"],
} as const;

function getProperty(post: BlogPost, field: keyof typeof blogFields) {
  const key = blogFields[field];

  if (typeof key !== "string") {
    for (const candidate of key) {
      const value = post.data.properties[candidate];
      if (value) return value;
    }

    return undefined;
  }

  return post.data.properties[key];
}

export function isPublishedPost(post: BlogPost) {
  const status = getProperty(post, "status");
  return typeof status === "string" && status.trim().toLowerCase() === "publicado";
}

function dateFromValue(value: unknown): Date | undefined {
  if (!value) return undefined;

  if (value instanceof Date) return value;

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  if (typeof value === "object" && "start" in value) {
    const start = (value as { start?: unknown }).start;
    return typeof start === "string" ? dateFromValue(start) : undefined;
  }

  return undefined;
}

function authorFromValue(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return (
      value
        .map(authorFromValue)
        .filter(Boolean)
        .join(", ") || undefined
    );
  }

  if (typeof value === "object") {
    const author = value as { name?: unknown; email?: unknown };
    if (typeof author.name === "string" && author.name) return author.name;
    if (typeof author.email === "string" && author.email) return author.email;
  }

  return undefined;
}

function stringFromValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getBlogPostData(post: BlogPost): BlogPostData {
  const createdTime =
    dateFromValue(getProperty(post, "createdTime")) ??
    dateFromValue(post.data.page.createdTime) ??
    new Date(0);

  const lastEditedTime =
    dateFromValue(getProperty(post, "lastEditedTime")) ??
    dateFromValue(post.data.page.lastEditedTime);

  const status = getProperty(post, "status");
  const tags = getProperty(post, "tags");

  return {
    title: post.data.title,
    slug: post.data.slug,
    description: stringFromValue(getProperty(post, "description")),
    status: typeof status === "string" ? status : "",
    author: authorFromValue(getProperty(post, "author")),
    tags: Array.isArray(tags) ? tags : [],
    createdTime,
    lastEditedTime,
    cover: post.data.cover,
    coverAlt: post.data.coverAlt ?? post.data.title,
  };
}

export function sortPostsByDate(posts: BlogPost[]) {
  return [...posts].sort((a, b) => {
    const aTime = getBlogPostData(a).createdTime.getTime();
    const bTime = getBlogPostData(b).createdTime.getTime();

    return bTime - aTime;
  });
}

export async function getPublishedPosts() {
  const posts = await getCollection("notion");

  return sortPostsByDate(posts.filter(isPublishedPost));
}

export function getTagSlug(tag: string) {
  return slugify(tag, {
    lower: true,
    strict: true,
    trim: true,
    locale: "pt",
  });
}

export function getTagPath(tag: string) {
  return `/blog/tags/${getTagSlug(tag)}/`;
}

export function getTagArchives(posts: BlogPost[]) {
  const tags = new Map<string, TagArchive>();

  for (const post of posts) {
    for (const tag of new Set(getBlogPostData(post).tags)) {
      const slug = getTagSlug(tag);
      const existing = tags.get(slug);

      if (existing) {
        existing.posts.push(post);
        continue;
      }

      tags.set(slug, {
        name: tag,
        slug,
        posts: [post],
      });
    }
  }

  return [...tags.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
  );
}
