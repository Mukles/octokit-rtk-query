import toml from "@iarna/toml";
import matter from "gray-matter";
import yaml from "js-yaml";

export type format = "json" | "toml" | "yaml";

export function contentFormatter({
  data,
  page_content,
  format,
}: {
  data: { [key: string]: any };
  page_content: string;
  format: format;
}) {
  if (format === "json") {
    const jsonContent = JSON.stringify(data, null, 2);
    return jsonContent;
  } else if (format === "toml") {
    const tomlContent = `${toml.stringify(data)}`;
    return tomlContent;
  } else {
    const yamlContent = `---\n${yaml.dump(data, { noRefs: true })}---\n${
      page_content || ""
    }`;
    return yamlContent;
  }
}

export const parseContentJson = (content: string, format: format) => {
  if (format === "json") {
    return { data: JSON.parse(content) };
  } else if (format === "toml") {
    let updatedMarkdown =
      "---toml" +
      content
        .replace(/\+\+\+/g, "---")
        .replace(/\+\+\+$/, "---")
        .substring(3);

    const file = matter(updatedMarkdown, {
      engines: {
        toml: toml.parse.bind(toml),
      },
    });
    return { data: file.data, content: file.content };
  } else {
    const { data, content: page_content } = matter(content);
    return { data, content: page_content };
  }
};
