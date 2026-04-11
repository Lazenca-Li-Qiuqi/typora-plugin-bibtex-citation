import { FILE_SOURCE_TYPE } from "../constants.js";
import { normalizeFileConfig } from "./settings.js";

const path = window.reqnode("path");

/**
 * 功能：尽量从当前 Typora 界面状态推断正在编辑的 Markdown 文件路径。
 * 输入：无。
 * 输出：当前 Markdown 绝对路径；若无法确定则返回 null。
 */
export function getActiveMarkdownPath() {
  const activeNode = document.querySelector(
    ".file-library-node.file-library-file-node.active",
  );
  if (activeNode) {
    const activePath = activeNode.getAttribute("data-path");
    if (activePath && activePath.endsWith(".md")) {
      return activePath;
    }
  }

  const titleMatch = document.title.match(/(.+\.md)/);
  if (titleMatch) {
    return titleMatch[1];
  }

  return null;
}

/**
 * 功能：获取相对路径解析时使用的 Typora 基准目录。
 * 输入：插件实例。
 * 输出：Typora 当前打开目录或进程工作目录。
 */
export function getTyporaBasePath(plugin) {
  const vaultPath = plugin?.app?.vault?.path;
  if (vaultPath) {
    return vaultPath;
  }
  return "";
}

/**
 * 功能：判断单条文件配置是否与其来源类别相匹配。
 * 输入：文件配置对象。
 * 输出：布尔值，`true` 表示该配置在语义上有效。
 */
export function isFileConfigShapeValid(fileConfig) {
  const normalized = normalizeFileConfig(fileConfig);
  if (!normalized) {
    return false;
  }

  if (normalized.sourceType === FILE_SOURCE_TYPE.ABSOLUTE) {
    return path.isAbsolute(normalized.path);
  }

  return true;
}

/**
 * 功能：按照文件自身声明的来源类别，把单条文件配置解析为绝对路径。
 * 输入：文件配置对象、插件实例。
 * 输出：解析后的绝对路径；若配置无效或当前上下文不可用则返回空字符串。
 */
export function resolveFileConfigPath(fileConfig, plugin) {
  const normalized = normalizeFileConfig(fileConfig);
  if (!normalized || !isFileConfigShapeValid(normalized)) {
    return "";
  }

  switch (normalized.sourceType) {
    case FILE_SOURCE_TYPE.ABSOLUTE:
      return normalized.path;
    case FILE_SOURCE_TYPE.MARKDOWN_RELATIVE: {
      const activeMarkdownPath = getActiveMarkdownPath();
      if (!activeMarkdownPath) {
        return "";
      }
      return path.resolve(path.dirname(activeMarkdownPath), normalized.path);
    }
    case FILE_SOURCE_TYPE.TYPORA_RELATIVE: {
      const basePath = getTyporaBasePath(plugin);
      if (!basePath) {
        return "";
      }
      return path.resolve(basePath, normalized.path);
    }
    default:
      return "";
  }
}

/**
 * 功能：按照当前设置把 BibTeX 路径解析为可读取的绝对路径。
 * 输入：文件配置对象、插件实例。
 * 输出：解析后的绝对路径；若在当前模式下不允许则返回空字符串。
 */
export function resolveBibFilePath(fileConfig, plugin) {
  return resolveFileConfigPath(fileConfig, plugin);
}

/**
 * 功能：按照当前设置把 CSL 路径解析为可读取的绝对路径。
 * 输入：文件配置对象、插件实例。
 * 输出：解析后的绝对路径；若在当前模式下不允许则返回空字符串。
 */
export function resolveCslFilePath(fileConfig, plugin) {
  return resolveFileConfigPath(fileConfig, plugin);
}
