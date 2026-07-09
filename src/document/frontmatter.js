import { FILE_SOURCE_TYPE } from "../constants.js";
import { createFileConfig, normalizeFileConfig } from "../bibtex/settings.js";

/**
 * 功能：从 Markdown 开头提取 YAML frontmatter 文本。
 * 输入：Markdown 原文。
 * 输出：frontmatter 文本；若不存在则返回空字符串。
 */
export function extractYamlFrontmatter(markdown) {
  const text = String(markdown || "").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/);
  if (!/^---\s*$/.test(lines[0] || "")) {
    return "";
  }

  for (let index = 1; index < lines.length; index += 1) {
    if (/^---\s*$/.test(lines[index])) {
      return lines.slice(1, index).join("\n");
    }
  }

  return "";
}

/**
 * 功能：解析 Markdown frontmatter 中声明的 BibTeX 与 CSL 文件配置。
 * 输入：Markdown 原文。
 * 输出：规范化后的 `{ bibFiles, cslFile }` 配置。
 */
export function parseMarkdownFrontmatterFileConfigs(markdown) {
  const frontmatter = extractYamlFrontmatter(markdown);
  if (!frontmatter) {
    return { bibFiles: [], cslFile: null };
  }

  const data = parseSimpleYaml(frontmatter);
  return {
    bibFiles: normalizeFrontmatterFileList(data.bib),
    cslFile: normalizeFrontmatterSingleFile(data.csl),
  };
}

/**
 * 功能：读取当前编辑器 Markdown，并解析文档级文件配置。
 * 输入：插件实例。
 * 输出：规范化后的 `{ bibFiles, cslFile }` 配置。
 */
export function getCurrentMarkdownFrontmatterFileConfigs(plugin) {
  const markdown = plugin?.window?.editor?.getMarkdown?.() || "";
  return parseMarkdownFrontmatterFileConfigs(markdown);
}

function normalizeFrontmatterFileList(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.map(normalizeFrontmatterFileConfig).filter(Boolean);
}

function normalizeFrontmatterSingleFile(value) {
  const values = Array.isArray(value) ? value : [value];
  for (const item of values) {
    const normalized = normalizeFrontmatterFileConfig(item);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

function normalizeFrontmatterFileConfig(value) {
  if (typeof value === "string") {
    return createFileConfig(value, FILE_SOURCE_TYPE.MARKDOWN_RELATIVE);
  }

  return null;
}

function parseSimpleYaml(content) {
  const lines = String(content || "").split(/\r?\n/);
  const data = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isBlankOrComment(line) || getIndent(line) !== 0) {
      continue;
    }

    const match = /^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/.exec(line);
    if (!match) {
      continue;
    }

    const [, key, rawValue = ""] = match;
    if (rawValue.trim()) {
      data[key] = parseScalar(rawValue);
      continue;
    }

    const blockLines = [];
    while (index + 1 < lines.length) {
      const nextLine = lines[index + 1];
      if (!isBlankOrComment(nextLine) && getIndent(nextLine) === 0) {
        break;
      }
      blockLines.push(nextLine);
      index += 1;
    }
    data[key] = parseBlock(blockLines);
  }

  return data;
}

function parseBlock(lines) {
  const usefulLines = lines.filter((line) => !isBlankOrComment(line));
  if (!usefulLines.length) {
    return "";
  }

  if (usefulLines[0].trimStart().startsWith("- ")) {
    return parseListBlock(usefulLines);
  }

  return parseObjectBlock(usefulLines);
}

function parseListBlock(lines) {
  const items = [];
  let currentObject = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      const itemText = trimmed.slice(2).trim();
      const pair = parseKeyValue(itemText);
      if (pair) {
        currentObject = { [pair.key]: pair.value };
        items.push(currentObject);
      } else {
        currentObject = null;
        items.push(parseScalar(itemText));
      }
      continue;
    }

    const pair = parseKeyValue(trimmed);
    if (pair && currentObject) {
      currentObject[pair.key] = pair.value;
    }
  }

  return items;
}

function parseObjectBlock(lines) {
  const object = {};
  for (const line of lines) {
    const pair = parseKeyValue(line.trim());
    if (pair) {
      object[pair.key] = pair.value;
    }
  }
  return object;
}

function parseKeyValue(text) {
  const match = /^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/.exec(text);
  if (!match) {
    return null;
  }
  return {
    key: match[1],
    value: parseScalar(match[2] || ""),
  };
}

function parseScalar(value) {
  const text = stripInlineComment(String(value || "").trim());
  if (/^\[.*\]$/.test(text)) {
    return text
      .slice(1, -1)
      .split(",")
      .map((item) => unquote(item.trim()))
      .filter(Boolean);
  }
  return unquote(text);
}

function stripInlineComment(value) {
  const quoted = /^['"]/.test(value);
  if (quoted) {
    return value;
  }
  const commentIndex = value.search(/\s#/);
  return commentIndex >= 0 ? value.slice(0, commentIndex).trim() : value;
}

function unquote(value) {
  const text = String(value || "").trim();
  const first = text[0];
  const last = text[text.length - 1];
  if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
    return text.slice(1, -1).trim();
  }
  return text;
}

function isBlankOrComment(line) {
  const trimmed = String(line || "").trim();
  return !trimmed || trimmed.startsWith("#");
}

function getIndent(line) {
  return String(line || "").match(/^ */)[0].length;
}
