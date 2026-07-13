import { toCslItem } from "./item.js";
import { getPluginRequire } from "./runtime.js";
import {
  collectCitationSourcesFromMarkdown,
  parseCitationSourceText,
} from "./citation-blocks.js";
import {
  CITATION_END_MARKER,
  CITATION_START_MARKER,
  createControlledCitationPattern,
  escapeControlledCitationPayload,
  unescapeControlledCitationPayload,
} from "./controlled-citations.js";
import { renderCitationClusters } from "./processor.js";

const pluginRequire = getPluginRequire();
const { Cite } = pluginRequire("@citation-js/core");
const CONTROLLED_CITATION_PATTERN = createControlledCitationPattern();

/**
 * 功能：把当前文档中的严格 `[@key]` 与受控 citation 块统一渲染为最新的 CSL 文中引用。
 * 输入：Markdown 文本、BibTeX 条目数组、已注册的 CSL 模板名。
 * 输出：返回改写后的 Markdown 与渲染或更新统计。
 */
export function renderCitationMarkdown(markdown, entries, templateName) {
  const source = String(markdown || "");
  const entryMap = new Map(entries.map((entry) => [entry.key, entry]));
  const citationSources = collectValidCitationSources(source, entryMap);
  if (!citationSources.length) {
    return createRenderResult(source);
  }

  const citationItems = createCitationItems(citationSources, entryMap);
  const cite = new Cite(citationItems);
  const citationOrder = createCitationOrder(citationSources, cite, templateName);
  const citationClusters = citationSources.map((citationSource) => ({
    keys: sortCitationKeys(citationSource.keys, citationOrder),
    citationMode: citationSource.citationMode,
  }));
  const renderedCitationClusters = renderCitationClusters(
    citationItems,
    citationClusters,
    templateName,
  );
  let cursor = 0;
  let changed = false;
  let renderedBlocks = 0;
  let renderedKeys = 0;
  let output = "";

  for (let index = 0; index < citationSources.length; index += 1) {
    const citationSource = citationSources[index];
    output += source.slice(cursor, citationSource.range.start);

    const nextBlock = buildControlledCitationBlock(
      citationSource.range.text,
      renderedCitationClusters[index],
    );
    const previousBlock = source.slice(citationSource.range.start, citationSource.range.end);
    output += nextBlock;
    if (nextBlock !== previousBlock) {
      changed = true;
    }
    renderedBlocks += 1;
    renderedKeys += citationSource.keys.length;
    cursor = citationSource.range.end;
  }

  output += source.slice(cursor);
  return createRenderResult(
    changed ? output : source,
    changed,
    renderedBlocks,
    renderedKeys,
  );
}

/**
 * 功能：把受控 citation 块恢复为原始 `[@key]` / `[@a; @b]` 文本。
 * 输入：Markdown 文本。
 * 输出：返回恢复后的 Markdown 与恢复统计。
 */
export function restoreCitationMarkdown(markdown) {
  const source = String(markdown || "");
  let restoredBlocks = 0;
  let restoredKeys = 0;

  const nextMarkdown = source.replace(CONTROLLED_CITATION_PATTERN, (_, rawCitationBlock) => {
    const restoredBlock = unescapeControlledCitationPayload(rawCitationBlock);
    const citation = parseCitationSourceText(restoredBlock);
    const keys = citation?.keys || [];
    restoredBlocks += 1;
    restoredKeys += keys.length;
    return restoredBlock;
  });

  return createRenderResult(
    nextMarkdown,
    nextMarkdown !== source,
    restoredBlocks,
    restoredKeys,
  );
}

function createRenderResult(markdown, changed = false, renderedBlocks = 0, renderedKeys = 0) {
  return {
    markdown,
    changed,
    renderedBlocks,
    renderedKeys,
  };
}

/**
 * 功能：为渲染后的 citation 文本包上一层受控注释块，同时保留原始 `[@key]`。
 * 输入：原始 citation block 文本、渲染后的 citation HTML。
 * 输出：可直接写回 Markdown 的受控 citation 块字符串。
 */
function buildControlledCitationBlock(rawCitationBlock, renderedCitationHtml) {
  return `${CITATION_START_MARKER}${escapeControlledCitationPayload(rawCitationBlock)} -->${renderedCitationHtml}${CITATION_END_MARKER}`;
}

/**
 * 功能：收集当前文档中可安全渲染或更新的引用源。
 * 输入：Markdown 文本、BibTeX 条目映射。
 * 输出：仅包含所有 key 都存在于文献库中的引用源数组。
 */
function collectValidCitationSources(markdown, entryMap) {
  return collectCitationSourcesFromMarkdown(markdown, (key) => entryMap.has(key));
}

/**
 * 功能：收集整篇文档中实际引用到的唯一 CSL-JSON 条目。
 * 输入：合法引用源列表、BibTeX 条目映射。
 * 输出：按首次出现顺序排列的 CSL-JSON 条目数组。
 */
function createCitationItems(citationSources, entryMap) {
  const citationItems = new Map();
  for (const citationSource of citationSources) {
    for (const key of citationSource.keys) {
      if (!citationItems.has(key)) {
        citationItems.set(key, toCslItem(entryMap.get(key)));
      }
    }
  }

  return Array.from(citationItems.values());
}

/**
 * 功能：根据当前样式的参考文献排序结果，为 citation key 建立稳定顺序。
 * 输入：合法引用源列表、Cite 实例、样式模板名。
 * 输出：key 到排序序号的映射；若无法生成则返回空映射。
 */
function createCitationOrder(citationSources, cite, templateName) {
  if (!citationSources.length) {
    return new Map();
  }

  const bibliographyEntries = cite.format("bibliography", {
    template: templateName,
    format: "text",
    asEntryArray: true,
  });

  return new Map(
    bibliographyEntries.map(([id], index) => [id, index]),
  );
}

/**
 * 功能：按样式推导出的参考文献顺序重排当前引用块中的 key。
 * 输入：引用 key 列表、key 到排序序号的映射。
 * 输出：排序后的新 key 列表；未知 key 保持在末尾并按原相对顺序保留。
 */
function sortCitationKeys(keys, citationOrder) {
  return [...keys].sort((left, right) => {
    const leftOrder = citationOrder.has(left) ? citationOrder.get(left) : Number.MAX_SAFE_INTEGER;
    const rightOrder = citationOrder.has(right) ? citationOrder.get(right) : Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}
