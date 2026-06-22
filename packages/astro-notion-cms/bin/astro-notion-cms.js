#!/usr/bin/env node
import "dotenv/config";
import { createNotionCmsClient } from "../src/index.js";

function readArg(name, fallback) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));

  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }

  return fallback;
}

function printHelp() {
  console.log(`astro-notion-cms

Usage:
  astro-notion-cms sync [--output-dir src/content/notion]

Environment:
  NOTION_TOKEN
  NOTION_DATA_SOURCE_ID
`);
}

async function sync() {
  const outputDir = readArg(
    "output-dir",
    process.env.NOTION_OUTPUT_DIR || "src/content/notion",
  );

  console.log("Sincronizando datasource do Notion...");

  const cms = createNotionCmsClient({
    authToken: process.env.NOTION_TOKEN,
    dataSourceId: process.env.NOTION_DATA_SOURCE_ID,
    outputDir,
  });

  await cms.syncAstroContent();
  console.log("Sync concluído.");
}

async function main() {
  const command = process.argv[2] || "sync";

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command !== "sync") {
    console.error(`Comando desconhecido: ${command}`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  await sync();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
