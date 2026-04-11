import { FILE_SOURCE_TYPE } from "../constants.js";

/**
 * 功能：把任意输入规范化为单条文件配置对象。
 * 输入：可能来自设置层的未知值。
 * 输出：合法的 `{ path, sourceType }` 对象；若无效则返回 `null`。
 */
export function normalizeFileConfig(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const filePath = String(value.path || "").trim();
  const sourceType = normalizeSourceType(value.sourceType);
  if (!filePath || !sourceType) {
    return null;
  }

  return {
    path: filePath,
    sourceType,
  };
}

/**
 * 功能：把设置层保存的 BibTeX 文件配置字符串解析为对象数组。
 * 输入：设置中的原始字符串，应为 JSON 数组。
 * 输出：过滤无效项后的文件配置数组。
 */
export function parseBibFileList(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(String(value));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map(normalizeFileConfig).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * 功能：把文件配置数组序列化为设置层保存的 JSON 字符串。
 * 输入：BibTeX 文件配置数组。
 * 输出：写回设置时使用的 JSON 字符串。
 */
export function serializeBibFileList(items) {
  const normalized = Array.isArray(items)
    ? items.map(normalizeFileConfig).filter(Boolean)
    : [];
  return JSON.stringify(normalized);
}

/**
 * 功能：解析设置中的单条文件配置。
 * 输入：设置层原始值，应为 JSON 对象字符串。
 * 输出：合法文件配置对象；若为空或无效则返回 `null`。
 */
export function parseSingleFileConfig(value) {
  if (!value) {
    return null;
  }

  try {
    return normalizeFileConfig(JSON.parse(String(value)));
  } catch {
    return null;
  }
}

/**
 * 功能：把单条文件配置序列化为设置层保存的 JSON 字符串。
 * 输入：文件配置对象。
 * 输出：JSON 字符串；若配置为空则返回空字符串。
 */
export function serializeSingleFileConfig(item) {
  const normalized = normalizeFileConfig(item);
  return normalized ? JSON.stringify(normalized) : "";
}

/**
 * 功能：创建新的文件配置对象。
 * 输入：路径与来源类别。
 * 输出：已规范化的文件配置对象。
 */
export function createFileConfig(path, sourceType) {
  return normalizeFileConfig({ path, sourceType });
}

/**
 * 功能：把未知来源类别规范化为受支持的枚举值。
 * 输入：来源类别字符串。
 * 输出：受支持的来源类别；若无效则返回空字符串。
 */
export function normalizeSourceType(sourceType) {
  switch (String(sourceType || "").trim()) {
    case FILE_SOURCE_TYPE.MARKDOWN_RELATIVE:
      return FILE_SOURCE_TYPE.MARKDOWN_RELATIVE;
    case FILE_SOURCE_TYPE.TYPORA_RELATIVE:
      return FILE_SOURCE_TYPE.TYPORA_RELATIVE;
    case FILE_SOURCE_TYPE.ABSOLUTE:
      return FILE_SOURCE_TYPE.ABSOLUTE;
    default:
      return "";
  }
}
