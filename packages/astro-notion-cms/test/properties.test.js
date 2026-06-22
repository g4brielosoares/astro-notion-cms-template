import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeNotionProperties,
  normalizePropertyValue,
  toSafeCamelCase,
} from "../src/index.js";

test("converts Notion property names to safe camelCase", () => {
  assert.equal(toSafeCamelCase("Data de publicação"), "dataDePublicacao");
  assert.equal(toSafeCamelCase("Última edição"), "ultimaEdicao");
  assert.equal(toSafeCamelCase("123 Campo"), "property123Campo");
});

test("normalizes common Notion property values", () => {
  assert.equal(
    normalizePropertyValue({
      type: "title",
      title: [{ plain_text: "Meu post" }],
    }),
    "Meu post",
  );

  assert.deepEqual(
    normalizePropertyValue({
      type: "multi_select",
      multi_select: [{ name: "Astro" }, { name: "Notion" }],
    }),
    ["Astro", "Notion"],
  );

  assert.deepEqual(
    normalizePropertyValue({
      type: "date",
      date: { start: "2026-06-22", end: null, time_zone: null },
    }),
    { start: "2026-06-22", end: null, timeZone: null },
  );
});

test("keeps datasource property names and resolves normalized key collisions", () => {
  const metadata = normalizeNotionProperties(
    {
      Title: {
        type: "title",
        title: [{ plain_text: "Página" }],
      },
      "title!": {
        type: "rich_text",
        rich_text: [{ plain_text: "Título alternativo" }],
      },
      Status: {
        type: "status",
        status: { name: "Publicado" },
      },
    }
  );

  assert.equal(metadata.title, "Página");
  assert.equal(metadata.title2, "Título alternativo");
  assert.equal(metadata.status, "Publicado");
});
