export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function toSafeCamelCase(value) {
  const ascii = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();

  if (!ascii) return "property";

  const words = ascii.split(/\s+/);
  const [first = "property", ...rest] = words;

  const camel = [
    first.charAt(0).toLowerCase() + first.slice(1),
    ...rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1)),
  ].join("");

  return /^[a-zA-Z_]/.test(camel) ? camel : `property${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
}

export function getUniqueKey(key, usedKeys) {
  let candidate = key;
  let index = 2;

  while (usedKeys.has(candidate)) {
    candidate = `${key}${index}`;
    index += 1;
  }

  usedKeys.add(candidate);
  return candidate;
}

export function richTextToPlain(items) {
  return ensureArray(items).map((item) => item.plain_text || "").join("");
}

export function normalizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name ?? "",
    avatarUrl: user.avatar_url ?? null,
    type: user.type ?? null,
    email: user.person?.email ?? null,
  };
}

export function normalizeFile(file) {
  if (!file) return null;

  if (file.type === "file") {
    return {
      name: file.name ?? "",
      type: "file",
      url: file.file?.url ?? "",
      expiryTime: file.file?.expiry_time ?? null,
    };
  }

  if (file.type === "external") {
    return {
      name: file.name ?? "",
      type: "external",
      url: file.external?.url ?? "",
    };
  }

  return {
    name: file.name ?? "",
    type: file.type ?? null,
  };
}

export function normalizePropertyValue(property) {
  if (!property || !property.type) return null;

  switch (property.type) {
    case "title":
      return richTextToPlain(property.title);
    case "rich_text":
      return richTextToPlain(property.rich_text);
    case "number":
      return property.number ?? null;
    case "checkbox":
      return Boolean(property.checkbox);
    case "select":
      return property.select?.name ?? "";
    case "status":
      return property.status?.name ?? "";
    case "multi_select":
      return ensureArray(property.multi_select).map((item) => item.name).filter(Boolean);
    case "date":
      return property.date
        ? {
            start: property.date.start ?? null,
            end: property.date.end ?? null,
            timeZone: property.date.time_zone ?? null,
          }
        : null;
    case "people":
      return ensureArray(property.people).map(normalizeUser).filter(Boolean);
    case "files":
      return ensureArray(property.files).map(normalizeFile).filter(Boolean);
    case "relation":
      return ensureArray(property.relation).map((item) => item.id).filter(Boolean);
    case "url":
      return property.url ?? "";
    case "email":
      return property.email ?? "";
    case "phone_number":
      return property.phone_number ?? "";
    case "created_time":
      return property.created_time ?? "";
    case "last_edited_time":
      return property.last_edited_time ?? "";
    case "created_by":
      return normalizeUser(property.created_by);
    case "last_edited_by":
      return normalizeUser(property.last_edited_by);
    case "formula":
      return normalizeFormula(property.formula);
    case "rollup":
      return normalizeRollup(property.rollup);
    case "unique_id":
      return property.unique_id
        ? {
            prefix: property.unique_id.prefix ?? null,
            number: property.unique_id.number ?? null,
          }
        : null;
    case "verification":
      return property.verification
        ? {
            state: property.verification.state ?? null,
            verifiedBy: normalizeUser(property.verification.verified_by),
            date: property.verification.date ?? null,
          }
        : null;
    default:
      return null;
  }
}

export function normalizeFormula(formula) {
  if (!formula || !formula.type) return null;
  return formula[formula.type] ?? null;
}

export function normalizeRollup(rollup) {
  if (!rollup || !rollup.type) return null;

  if (rollup.type === "array") {
    return ensureArray(rollup.array).map(normalizePropertyValue);
  }

  return rollup[rollup.type] ?? null;
}

export function normalizeNotionProperties(properties = {}, initialKeys = []) {
  const usedKeys = new Set(initialKeys);
  const normalized = {};

  for (const [propertyName, propertyValue] of Object.entries(properties)) {
    const baseKey = toSafeCamelCase(propertyName);
    const key = getUniqueKey(baseKey, usedKeys);
    normalized[key] = normalizePropertyValue(propertyValue);
  }

  return normalized;
}

export function findTitle(properties = {}) {
  for (const property of Object.values(properties)) {
    if (property?.type === "title") {
      const title = normalizePropertyValue(property);
      if (title) return title;
    }
  }

  return "Sem título";
}
