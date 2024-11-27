export function fmDetector(content: string, ext?: string) {
  const isYaml = content.startsWith("---") || ext === ".md" || ext === ".mdx";
  const isToml = content.startsWith("+++") || ext === ".toml";
  const isJson =
    content.startsWith("{") || content.startsWith("[") || ext === ".json";
  if (isYaml) return "yaml";
  if (isToml) return "toml";
  if (isJson) return "json";

  return "toml";
}
