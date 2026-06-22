import YAML from "yaml";

export function buildFrontmatter(metadata) {
  const yaml = YAML.stringify(metadata, {
    nullStr: "null",
  });

  return `---\n${yaml}---\n`;
}
