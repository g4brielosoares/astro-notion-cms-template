import { Client } from "@notionhq/client";

export function createNotionClient(authToken) {
  if (!authToken) {
    throw new Error("NOTION_TOKEN não definido.");
  }

  return new Client({ auth: authToken });
}

export async function fetchDatasourcePages(notion, dataSourceId) {
  if (!dataSourceId) {
    throw new Error("NOTION_DATA_SOURCE_ID não definido.");
  }

  const pages = [];
  let cursor = undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const result of response.results ?? []) {
      if (result.object === "page") {
        pages.push(result);
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return pages;
}
