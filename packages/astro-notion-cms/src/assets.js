import fs from "node:fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

export async function mkdirp(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export function getExtensionFromUrl(url, fallback = ".png") {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();
    return ext || fallback;
  } catch {
    return fallback;
  }
}

export async function downloadFile(url, filePath, fetchImpl = fetch) {
  const response = await fetchImpl(url);
  if (!response.ok || !response.body) {
    throw new Error(`Falha ao baixar arquivo: ${url}`);
  }

  await mkdirp(path.dirname(filePath));
  const stream = createWriteStream(filePath);
  await pipeline(response.body, stream);
}

export async function replaceRemoteImages(markdown, postDir, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const matches = [...markdown.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g)];
  let output = markdown;
  let imageIndex = 1;

  for (const match of matches) {
    const alt = match[1] || "";
    const url = match[2];
    const ext = getExtensionFromUrl(url, ".jpg");
    const filename = `image-${String(imageIndex).padStart(2, "0")}${ext}`;
    const absolutePath = path.join(postDir, filename);
    const relativePath = `./${filename}`;

    try {
      await downloadFile(url, absolutePath, fetchImpl);
      output = output.replace(match[0], `![${alt}](${relativePath})`);
      imageIndex += 1;
    } catch (error) {
      options.logger?.warn?.(`Não consegui baixar imagem ${url}: ${error.message}`);
    }
  }

  return output;
}

export async function downloadCover(coverUrl, postDir, options = {}) {
  if (!coverUrl) return "";

  const fetchImpl = options.fetchImpl ?? fetch;
  const ext = getExtensionFromUrl(coverUrl, ".png");
  const fileName = `cover${ext}`;
  const absolutePath = path.join(postDir, fileName);

  await downloadFile(coverUrl, absolutePath, fetchImpl);
  return `./${fileName}`;
}
