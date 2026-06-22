import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const notion = defineCollection({
  loader: glob({
    base: "./src/content/notion",
    pattern: "**/index.md",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      page: z.object({
        id: z.string(),
        url: z.string().optional(),
        publicUrl: z.string().nullable().optional(),
        createdTime: z.coerce.date(),
        lastEditedTime: z.coerce.date(),
        createdBy: z.any().optional(),
        lastEditedBy: z.any().optional(),
        parent: z.any().optional(),
        isArchived: z.boolean().default(false),
        inTrash: z.boolean().default(false),
        isLocked: z.boolean().default(false),
      }).passthrough(),
      properties: z.object({}).passthrough().default({}),
      cover: image().nullable().optional(),
      coverAlt: z.string().optional(),
    }).passthrough(),
});

export const collections = {
  notion,
};
