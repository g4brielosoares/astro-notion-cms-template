import test from "node:test";
import assert from "node:assert/strict";
import YAML from "yaml";
import { buildFrontmatter, prepareNotionPage } from "../src/index.js";

test("prepares page metadata and datasource properties in separate namespaces", () => {
  const page = {
    object: "page",
    id: "page-1",
    url: "https://www.notion.so/page-1",
    public_url: null,
    created_time: "2026-06-01T00:00:00.000Z",
    last_edited_time: "2026-06-22T00:00:00.000Z",
    created_by: { object: "user", id: "user-1" },
    last_edited_by: { object: "user", id: "user-2" },
    parent: {
      type: "data_source_id",
      data_source_id: "source-1",
      database_id: "database-1",
    },
    in_trash: false,
    is_archived: false,
    is_locked: false,
    icon: { type: "emoji", emoji: "A" },
    cover: { type: "external", external: { url: "https://example.com/cover.png" } },
    properties: {
      Title: {
        type: "title",
        title: [{ plain_text: "Minha Página" }],
      },
    },
  };

  const prepared = prepareNotionPage(page);

  assert.equal(prepared.metadata.title, "Minha Página");
  assert.equal(prepared.metadata.slug, "minha-pagina");
  assert.equal(prepared.metadata.cover, null);
  assert.equal(prepared.metadata.page.id, "page-1");
  assert.equal(prepared.metadata.page.url, "https://www.notion.so/page-1");
  assert.equal(prepared.metadata.page.publicUrl, null);
  assert.equal(prepared.metadata.page.createdTime, "2026-06-01T00:00:00.000Z");
  assert.equal(prepared.metadata.page.lastEditedTime, "2026-06-22T00:00:00.000Z");
  assert.deepEqual(prepared.metadata.page.createdBy, { id: "user-1" });
  assert.deepEqual(prepared.metadata.page.lastEditedBy, { id: "user-2" });
  assert.deepEqual(prepared.metadata.page.parent, {
    type: "data_source_id",
    dataSourceId: "source-1",
    databaseId: "database-1",
  });
  assert.equal(prepared.metadata.page.isArchived, false);
  assert.equal(prepared.metadata.page.inTrash, false);
  assert.equal(prepared.metadata.page.isLocked, false);
  assert.equal(prepared.metadata.properties.title, "Minha Página");
  assert.equal(prepared.remoteCoverUrl, "https://example.com/cover.png");
  assert.equal("rawPage" in prepared, false);
  assert.equal("icon" in prepared.metadata, false);
  assert.equal("pageId" in prepared.metadata, false);
  assert.equal("url" in prepared.metadata, false);
  assert.equal("coverUrl" in prepared.metadata, false);
  assert.equal("notionId" in prepared.metadata, false);
  assert.equal("createdTime" in prepared.metadata, false);
});

test("serializes YAML-safe frontmatter with JSON-compatible values", () => {
  const frontmatter = buildFrontmatter({
    title: "Teste",
    tags: ["Astro", "Notion"],
    date: { start: "2026-06-22", end: null },
  });

  assert.match(frontmatter, /^---\n/);
  assert.match(frontmatter, /---\n$/);

  const parsed = YAML.parse(frontmatter.replace(/^---\n/, "").replace(/---\n$/, ""));
  assert.equal(parsed.title, "Teste");
  assert.deepEqual(parsed.tags, ["Astro", "Notion"]);
  assert.deepEqual(parsed.date, { start: "2026-06-22", end: null });
});

test("can include the raw Notion page when explicitly requested", () => {
  const page = {
    object: "page",
    id: "page-1",
    properties: {
      Title: {
        type: "title",
        title: [{ plain_text: "Minha Página" }],
      },
    },
  };

  const prepared = prepareNotionPage(page, { includeRawPage: true });

  assert.equal(prepared.rawPage, page);
});
