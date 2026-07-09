import { parseBibEntries } from "./parser.js";
import {
  getActiveMarkdownPath,
  isFileConfigShapeValid,
  resolveBibFilePath,
} from "./path-resolver.js";
import { getActiveBibFileConfigs } from "./source-configs.js";

const fs = window.reqnode("fs");

/**
 * 功能：管理 BibTeX 文件读取、mtime 缓存与去重合并逻辑。
 * 输入：构造时接收插件实例，以便访问设置与国际化文案。
 * 输出：提供缓存清理与条目读取能力的存储对象。
 */
export class BibEntryStore {
  constructor(plugin) {
    this.plugin = plugin;
    this.cache = new Map();
    this.mergedEntries = null;
    this.mergedEntryKeySet = null;
    this.mergedSourceKey = "";
  }

  /**
   * 功能：清空已读取的 BibTeX 文件缓存。
   * 输入：无。
   * 输出：无返回值。
   */
  clear() {
    this.cache.clear();
    this.mergedEntries = null;
    this.mergedEntryKeySet = null;
    this.mergedSourceKey = "";
  }

  /**
   * 功能：判断当前是否已经持有合并后的文献库缓存。
   * 输入：无。
   * 输出：若已存在 `mergedEntries` 则返回 `true`，否则返回 `false`。
   */
  hasMergedEntries() {
    return Array.isArray(this.mergedEntries);
  }

  /**
   * 功能：获取当前合并文献库对应的合法 citation key 集合。
   * 说明：该集合与 `mergedEntries` 共享同一份缓存生命周期，不会在每次统计时重复构建。
   * 输入：无。
   * 输出：包含当前所有合法 citation key 的 Set。
   */
  getEntryKeySet() {
    if (this.mergedEntryKeySet) {
      return this.mergedEntryKeySet;
    }

    this.getEntries();
    return this.mergedEntryKeySet || new Set();
  }

  /**
   * 功能：读取设置中的 BibTeX 文件并合并为检索条目列表。
   * 说明：若当前已有 `mergedEntries`，则直接复用；只有缓存被清空后，才会在这里重新读取 `.bib` 文件。
   * 输入：无，内部从插件设置读取路径配置。
   * 输出：按配置优先级去重后的文献条目数组。
   */
  getEntries() {
    const bibFiles = getActiveBibFileConfigs(this.plugin);
    const sourceKey = JSON.stringify({
      markdownPath: getActiveMarkdownPath() || "",
      bibFiles,
    });

    if (this.mergedEntries && this.mergedSourceKey === sourceKey) {
      return this.mergedEntries;
    }

    if (!bibFiles.length) {
      this.mergedEntries = [];
      this.mergedEntryKeySet = new Set();
      this.mergedSourceKey = sourceKey;
      return this.mergedEntries;
    }

    const merged = [];
    const seenKeys = new Set();

    for (const bibFile of bibFiles) {
      const resolvedPath = resolveBibFilePath(bibFile, this.plugin);

      if (!resolvedPath) {
        const warning = isFileConfigShapeValid(bibFile)
          ? this.plugin.i18n.t.unresolvableFilePath
          : this.plugin.i18n.t.invalidFileConfig;
        console.warn(`${warning}${bibFile?.path || ""}`);
        continue;
      }

      if (!fs.existsSync(resolvedPath)) {
        console.warn(this.plugin.i18n.t.fileNotFound + resolvedPath);
        continue;
      }

      try {
        const stat = fs.statSync(resolvedPath);
        const cacheItem = this.cache.get(resolvedPath);

        if (!cacheItem || cacheItem.mtimeMs !== stat.mtimeMs) {
          const content = fs.readFileSync(resolvedPath, "utf8");
          this.cache.set(resolvedPath, {
            mtimeMs: stat.mtimeMs,
            entries: parseBibEntries(content, resolvedPath),
          });
        }

        const { entries } = this.cache.get(resolvedPath);
        for (const entry of entries) {
          if (seenKeys.has(entry.key)) continue;
          seenKeys.add(entry.key);
          merged.push(entry);
        }
      } catch (error) {
        console.error(this.plugin.i18n.t.loadError + resolvedPath, error);
      }
    }

    this.mergedEntries = merged;
    this.mergedEntryKeySet = seenKeys;
    this.mergedSourceKey = sourceKey;
    return this.mergedEntries;
  }
}
