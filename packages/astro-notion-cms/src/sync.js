import fs from "node:fs/promises";
import path from "node:path";
import { createNotionClient, fetchDatasourcePages } from "./client.js";
import { prepareNotionPage } from "./page.js";
import { pageToMarkdown } from "./markdown.js";
import { buildFrontmatter } from "./frontmatter.js";
import { downloadCover, mkdirp, replaceRemoteImages } from "./assets.js";

export async function fetchPages(config) {
  const notion = config.notionClient ?? createNotionClient(config.authToken);
  return fetchDatasourcePages(notion, config.dataSourceId);
}

export async function prepareEntries(config) {
  const notion = config.notionClient ?? createNotionClient(config.authToken);
  const pages = config.pages ?? await fetchPages({ ...config, notionClient: notion });
  const entries = [];

  for (const page of pages) {
    const prepared = prepareNotionPage(page, config);
    const markdown = await pageToMarkdown(notion, page.id);

    entries.push({
      ...prepared,
      markdown,
    });
  }

  return entries;
}

export async function prepareAstroEntries(config) {
  const outputDir = path.resolve(config.outputDir ?? "src/content/notion");
  const logger = config.logger ?? console;
  const entries = config.entries ?? await prepareEntries(config);
  const astroEntries = [];

  for (const entry of entries) {
    const entryDir = path.join(outputDir, entry.metadata.slug);
    await mkdirp(entryDir);

    const metadata = { ...entry.metadata };
    let markdown = await replaceRemoteImages(entry.markdown, entryDir, {
      fetchImpl: config.fetchImpl,
      logger,
    });

    if (entry.remoteCoverUrl) {
      try {
        metadata.cover = await downloadCover(entry.remoteCoverUrl, entryDir, {
          fetchImpl: config.fetchImpl,
        });
      } catch (error) {
        logger.warn?.(`Não consegui baixar cover de ${entry.metadata.slug}: ${error.message}`);
      }
    }

    const filePath = path.join(entryDir, "index.md");

    astroEntries.push({
      ...entry,
      filePath,
      markdown,
      metadata,
    });
  }

  return astroEntries;
}

export async function writeAstroContent(entries) {
  const written = [];

  for (const entry of entries) {
    await fs.writeFile(
      entry.filePath,
      `${buildFrontmatter(entry.metadata)}${entry.markdown.trim()}\n`,
      "utf8",
    );

    written.push({
      slug: entry.metadata.slug,
      filePath: entry.filePath,
      metadata: entry.metadata,
    });
  }

  return written;
}

export async function syncAstroContent(config) {
  const outputDir = path.resolve(config.outputDir ?? "src/content/notion");
  const logger = config.logger ?? console;

  await fs.rm(outputDir, { recursive: true, force: true });
  await mkdirp(outputDir);

  const entries = await prepareAstroEntries({
    ...config,
    outputDir,
    logger,
  });
  const written = await writeAstroContent(entries);

  for (const entry of written) {
    logger.log?.(`GERADO: ${entry.slug}`);
  }

  return written;
}

export function createNotionCmsClient(config) {
  const notion = config.notionClient ?? createNotionClient(config.authToken);
  const baseConfig = {
    ...config,
    notionClient: notion,
  };

  return {
    notion,
    fetchPages: () => fetchPages(baseConfig),
    fetchDatasourcePages: () => fetchPages(baseConfig),
    prepareEntries: (overrides = {}) => prepareEntries({ ...baseConfig, ...overrides }),
    prepareAstroEntries: (overrides = {}) => prepareAstroEntries({ ...baseConfig, ...overrides }),
    writeAstroContent,
    syncAstroContent: (overrides = {}) => syncAstroContent({ ...baseConfig, ...overrides }),
  };
}
