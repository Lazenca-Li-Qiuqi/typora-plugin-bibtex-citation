import { findFirstInvalidCitationProblem } from "../csl/citation-blocks.js";
import { summarizeText } from "../utils/html.js";

/**
 * 功能：读取当前编辑器中的 Markdown 文本，供主控层复用。
 * 输入：插件实例。
 * 输出：当前编辑器 Markdown；若运行时不可用则返回空字符串。
 */
export function getCurrentMarkdown(plugin) {
  return plugin.window.editor?.getMarkdown?.() || "";
}

/**
 * 功能：把改写结果写回当前文档，并在成功后统一刷新缓存与侧边栏。
 * 输入：插件实例、包含 `changed` 与 `markdown` 的改写结果对象。
 * 输出：原样返回输入结果；若宿主未暴露 reload API 则抛错。
 */
export function applyDocumentRewriteResult(plugin, result) {
  if (!result.changed) {
    return result;
  }

  const reloadContent = plugin.window.File?.reloadContent;
  if (typeof reloadContent !== "function") {
    throw new Error(plugin.i18n.t.sidebar.renderReloadUnavailable);
  }

  reloadContent(result.markdown, false, true, false, true);
  plugin.resetDocumentState();
  plugin.sidebarPanel?.render?.();
  return result;
}

/**
 * 功能：在执行 CSL 相关文档改写前，阻止包含未知 key 或非法 citation block 的文档继续处理。
 * 输入：插件实例。
 * 输出：若发现非法问题则抛错；否则无返回值。
 */
export function ensureNoInvalidCitationKeysForCslAction(plugin) {
  const markdown = getCurrentMarkdown(plugin);
  const entries = plugin.getBibEntries();
  const entryKeySet = new Set(entries.map((entry) => entry.key));
  const invalidProblem = findFirstInvalidCitationProblem(
    markdown,
    (key) => entryKeySet.has(key),
  );
  if (!invalidProblem) {
    return;
  }

  if (invalidProblem.type === "unknown-key") {
    throw new Error(plugin.i18n.t.sidebar.invalidCitationPrefix + invalidProblem.key);
  }

  throw new Error(
    plugin.i18n.t.sidebar.invalidCitationBlockPrefix
      + summarizeText(invalidProblem.blockText),
  );
}

/**
 * 功能：把当前文档中的严格合法 citation source 渲染为受控 citation 块。
 * 输入：插件实例。
 * 输出：返回本次改写结果与统计。
 */
export async function renderCurrentDocumentCitations(plugin) {
  ensureNoInvalidCitationKeysForCslAction(plugin);
  const markdown = getCurrentMarkdown(plugin);
  const entries = plugin.getBibEntries();
  const [{ ensureCslTemplate }, { renderCitationMarkdown }] = await Promise.all([
    import("../csl/assets.js"),
    import("../csl/render.js"),
  ]);
  const templateName = ensureCslTemplate(plugin);
  const result = renderCitationMarkdown(markdown, entries, templateName);
  return applyDocumentRewriteResult(plugin, result);
}

/**
 * 功能：把当前文档中的受控 citation 块恢复为原始 `[@key]` 文本。
 * 输入：插件实例。
 * 输出：返回本次恢复结果与统计。
 */
export async function restoreCurrentDocumentCitations(plugin) {
  const markdown = getCurrentMarkdown(plugin);
  const { restoreCitationMarkdown } = await import("../csl/render.js");
  const result = restoreCitationMarkdown(markdown);
  return applyDocumentRewriteResult(plugin, result);
}

/**
 * 功能：根据当前文档中的合法引用源生成或更新 bibliography 受控块。
 * 输入：插件实例。
 * 输出：返回本次改写结果与 key 统计。
 */
export async function upsertCurrentDocumentBibliography(plugin) {
  ensureNoInvalidCitationKeysForCslAction(plugin);
  const markdown = getCurrentMarkdown(plugin);
  const entries = plugin.getBibEntries();
  const [{ ensureCslTemplate }, { upsertBibliographyMarkdown }] = await Promise.all([
    import("../csl/assets.js"),
    import("../csl/bibliography.js"),
  ]);
  const templateName = ensureCslTemplate(plugin);
  const result = upsertBibliographyMarkdown(
    markdown,
    entries,
    templateName,
    plugin.i18n.t.sidebar.bibliographyHeading,
  );
  return applyDocumentRewriteResult(plugin, result);
}

/**
 * 功能：删除当前文档中由本插件生成的受控 bibliography 块。
 * 输入：插件实例。
 * 输出：返回本次删除结果。
 */
export async function removeCurrentDocumentBibliography(plugin) {
  const markdown = getCurrentMarkdown(plugin);
  const { removeBibliographyMarkdown } = await import("../csl/bibliography.js");
  const result = removeBibliographyMarkdown(markdown);
  return applyDocumentRewriteResult(plugin, result);
}
