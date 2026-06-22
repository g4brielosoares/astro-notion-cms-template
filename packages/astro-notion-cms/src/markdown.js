import { NotionToMarkdown } from "notion-to-md";

export async function pageToMarkdown(notion, pageId) {
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const mdBlocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdBlocks);

  return typeof mdString === "string" ? mdString : mdString.parent || "";
}
