export interface NotionClientLike {
  dataSources: {
    query(args: {
      data_source_id: string;
      start_cursor?: string;
      page_size?: number;
    }): Promise<{
      results?: unknown[];
      has_more?: boolean;
      next_cursor?: string | null;
    }>;
  };
}

export interface NotionPageLike {
  object?: "page" | string;
  id: string;
  url?: string;
  public_url?: string | null;
  created_time?: string;
  last_edited_time?: string;
  created_by?: { id?: string } | null;
  last_edited_by?: { id?: string } | null;
  cover?: unknown;
  parent?: unknown;
  properties?: Record<string, unknown>;
  is_archived?: boolean;
  in_trash?: boolean;
  is_locked?: boolean;
}

export interface NotionCmsConfig {
  authToken?: string;
  dataSourceId?: string;
  outputDir?: string;
  notionClient?: NotionClientLike;
  pages?: NotionPageLike[];
  entries?: PreparedEntry[];
  includeRawPage?: boolean;
  fetchImpl?: typeof fetch;
  logger?: Pick<Console, "log" | "warn">;
  slugOptions?: Record<string, unknown>;
}

export interface NotionCmsMetadata {
  title: string;
  slug: string;
  cover: string | null;
  page: {
    id: string;
    url: string;
    publicUrl: string | null;
    createdTime: string;
    lastEditedTime: string;
    createdBy: { id: string } | null;
    lastEditedBy: { id: string } | null;
    parent: {
      type: string;
      dataSourceId: string | null;
      databaseId: string | null;
    } | null;
    isArchived: boolean;
    inTrash: boolean;
    isLocked: boolean;
  };
  properties: Record<string, unknown>;
}

export interface PreparedNotionPage {
  remoteCoverUrl: string;
  metadata: NotionCmsMetadata;
  rawPage?: NotionPageLike;
}

export interface PreparedEntry extends PreparedNotionPage {
  markdown: string;
}

export interface AstroEntry extends PreparedEntry {
  filePath: string;
}

export interface WrittenEntry {
  slug: string;
  filePath: string;
  metadata: NotionCmsMetadata;
}

export function createNotionClient(authToken?: string): NotionClientLike;
export function fetchDatasourcePages(
  notion: NotionClientLike,
  dataSourceId?: string,
): Promise<NotionPageLike[]>;
export function fetchPages(config: NotionCmsConfig): Promise<NotionPageLike[]>;
export function ensureArray<T>(value: T[] | unknown): T[];
export function findTitle(properties?: Record<string, unknown>): string;
export function normalizeNotionProperties(
  properties?: Record<string, unknown>,
  initialKeys?: string[],
): Record<string, unknown>;
export function normalizePropertyValue(property: unknown): unknown;
export function toSafeCamelCase(value: unknown): string;
export function buildSlug(title: string, options?: Record<string, unknown>): string;
export function getCoverUrlFromPage(page: NotionPageLike): string;
export function prepareNotionPage(
  page: NotionPageLike,
  options?: NotionCmsConfig,
): PreparedNotionPage;
export function pageToMarkdown(notion: NotionClientLike, pageId: string): Promise<string>;
export function downloadCover(
  coverUrl: string,
  postDir: string,
  options?: Pick<NotionCmsConfig, "fetchImpl">,
): Promise<string>;
export function downloadFile(
  url: string,
  filePath: string,
  fetchImpl?: typeof fetch,
): Promise<void>;
export function getExtensionFromUrl(url: string, fallback?: string): string;
export function replaceRemoteImages(
  markdown: string,
  postDir: string,
  options?: Pick<NotionCmsConfig, "fetchImpl" | "logger">,
): Promise<string>;
export function buildFrontmatter(metadata: Record<string, unknown>): string;
export function createNotionCmsClient(config: NotionCmsConfig): {
  notion: NotionClientLike;
  fetchPages: () => Promise<NotionPageLike[]>;
  fetchDatasourcePages: () => Promise<NotionPageLike[]>;
  prepareEntries: (overrides?: NotionCmsConfig) => Promise<PreparedEntry[]>;
  prepareAstroEntries: (overrides?: NotionCmsConfig) => Promise<AstroEntry[]>;
  writeAstroContent: typeof writeAstroContent;
  syncAstroContent: (overrides?: NotionCmsConfig) => Promise<WrittenEntry[]>;
};
export function prepareEntries(config: NotionCmsConfig): Promise<PreparedEntry[]>;
export function prepareAstroEntries(config: NotionCmsConfig): Promise<AstroEntry[]>;
export function writeAstroContent(entries: AstroEntry[]): Promise<WrittenEntry[]>;
export function syncAstroContent(config: NotionCmsConfig): Promise<WrittenEntry[]>;
