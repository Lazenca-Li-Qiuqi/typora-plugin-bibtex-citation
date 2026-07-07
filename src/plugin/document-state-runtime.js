/**
 * 功能：清空当前 Markdown 文档的轻量状态缓存。
 * 输入：插件实例。
 * 输出：无返回值。
 */
export function resetDocumentState(plugin) {
  plugin.documentState.clear();
}

/**
 * 功能：获取当前文档引用统计，并复用轻量状态缓存。
 * 输入：插件实例。
 * 输出：包含唯一条数、总次数与错误信息的对象。
 */
export function getCurrentDocumentCitationState(plugin) {
  const markdown = plugin.window.editor?.getMarkdown?.() || "";
  const validCitationKeys = plugin.bibStore.getEntryKeySet();
  return plugin.documentState.getCitationState(markdown, validCitationKeys);
}
