import { getCurrentMarkdownFrontmatterFileConfigs } from "../document/frontmatter.js";
import { parseBibFileList, parseSingleFileConfig } from "./settings.js";

/**
 * 功能：合并当前文档 frontmatter 与设置页中的 BibTeX 文件配置。
 * 输入：插件实例。
 * 输出：按优先级排列的 BibTeX 文件配置数组。
 */
export function getActiveBibFileConfigs(plugin) {
  const frontmatterConfigs = getCurrentMarkdownFrontmatterFileConfigs(plugin).bibFiles;
  const settingConfigs = parseBibFileList(plugin?.settings?.get("bibFiles"));
  return [...frontmatterConfigs, ...settingConfigs];
}

/**
 * 功能：获取当前文档实际使用的 CSL 文件配置。
 * 输入：插件实例。
 * 输出：frontmatter 或设置页中的单个 CSL 文件配置。
 */
export function getActiveCslFileConfig(plugin) {
  const frontmatterConfig = getCurrentMarkdownFrontmatterFileConfigs(plugin).cslFile;
  return frontmatterConfig || parseSingleFileConfig(plugin?.settings?.get("cslFile"));
}
