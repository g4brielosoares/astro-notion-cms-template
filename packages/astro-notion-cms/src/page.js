import slugify from "slugify";
import { findTitle, normalizeNotionProperties } from "./properties.js";

export function getCoverUrlFromPage(page) {
  const cover = page?.cover;
  if (!cover) return "";

  if (cover.type === "file") {
    return cover.file?.url || "";
  }

  if (cover.type === "external") {
    return cover.external?.url || "";
  }

  return "";
}

export function buildSlug(title, options = {}) {
  return slugify(title || "sem-titulo", {
    lower: true,
    strict: true,
    trim: true,
    locale: "pt",
    ...options,
  });
}

function normalizePageUser(user) {
  if (!user) return null;
  return {
    id: user.id ?? "",
  };
}

function normalizeParent(parent) {
  if (!parent) return null;

  return {
    type: parent.type ?? "",
    dataSourceId: parent.data_source_id ?? null,
    databaseId: parent.database_id ?? null,
  };
}

export function prepareNotionPage(page, options = {}) {
  const title = findTitle(page.properties);
  const slug = buildSlug(title, options.slugOptions);
  const pageMetadata = {
    id: page.id,
    url: page.url ?? "",
    publicUrl: page.public_url ?? null,
    createdTime: page.created_time ?? "",
    lastEditedTime: page.last_edited_time ?? "",
    createdBy: normalizePageUser(page.created_by),
    lastEditedBy: normalizePageUser(page.last_edited_by),
    parent: normalizeParent(page.parent),
    isArchived: Boolean(page.is_archived),
    inTrash: Boolean(page.in_trash),
    isLocked: Boolean(page.is_locked),
  };

  const properties = normalizeNotionProperties(page.properties);

  return {
    remoteCoverUrl: getCoverUrlFromPage(page),
    metadata: {
      title,
      slug,
      cover: null,
      page: pageMetadata,
      properties,
    },
    ...(options.includeRawPage ? { rawPage: page } : {}),
  };
}
