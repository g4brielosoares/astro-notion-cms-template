import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fetchDatasourcePages, replaceRemoteImages } from "../src/index.js";

test("fetches datasource pages with pagination", async () => {
  const calls = [];
  const notion = {
    dataSources: {
      async query(args) {
        calls.push(args);

        if (!args.start_cursor) {
          return {
            results: [{ object: "page", id: "1" }, { object: "database", id: "skip" }],
            has_more: true,
            next_cursor: "cursor-2",
          };
        }

        return {
          results: [{ object: "page", id: "2" }],
          has_more: false,
          next_cursor: null,
        };
      },
    },
  };

  const pages = await fetchDatasourcePages(notion, "ds-1");

  assert.deepEqual(pages.map((page) => page.id), ["1", "2"]);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].start_cursor, "cursor-2");
});

test("downloads remote markdown images and rewrites them to relative paths", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "astro-notion-cms-"));
  const markdown = "![Alt](https://example.com/image.png)";
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("image"));
      controller.close();
    },
  });

  const output = await replaceRemoteImages(markdown, dir, {
    fetchImpl: async () => new Response(body, { status: 200 }),
  });

  assert.equal(output, "![Alt](./image-01.png)");
  assert.equal(await fs.readFile(path.join(dir, "image-01.png"), "utf8"), "image");
});
