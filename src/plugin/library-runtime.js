/**
 * 功能：把 BibTeX 文献库标记为失效，等待下一次懒加载时重读。
 * 输入：插件实例。
 * 输出：无返回值。
 */
export function invalidateLibrary(plugin) {
  plugin.bibStore.clear();
}

/**
 * 功能：立即重新加载 BibTeX 文献库，并刷新侧边栏。
 * 输入：插件实例。
 * 输出：无返回值。
 */
export function reloadLibraryNow(plugin) {
  plugin.invalidateLibrary();
  plugin.getBibEntries();
  plugin.sidebarPanel?.render?.();
}

/**
 * 功能：在文献库懒加载完成后，异步刷新一次侧边栏。
 * 输入：插件实例。
 * 输出：无返回值。
 */
export function scheduleSidebarRefresh(plugin) {
  if (plugin._sidebarRefreshScheduled) {
    return;
  }

  plugin._sidebarRefreshScheduled = true;
  plugin.window.requestAnimationFrame(() => {
    plugin._sidebarRefreshScheduled = false;
    plugin.sidebarPanel?.render?.();
  });
}

/**
 * 功能：在编辑器 `]` 输入或删除后，异步重算当前文档引用统计并刷新侧边栏。
 * 输入：插件实例。
 * 输出：无返回值。
 */
export function scheduleCitationStateRefresh(plugin) {
  if (plugin._citationStateRefreshScheduled) {
    return;
  }

  plugin._citationStateRefreshScheduled = true;
  plugin.window.requestAnimationFrame(() => {
    plugin._citationStateRefreshScheduled = false;
    plugin.resetDocumentState();
    plugin.sidebarPanel?.render?.();
  });
}

/**
 * 功能：获取当前可用于检索与展示的 BibTeX 条目列表，并在首次懒加载成功后刷新侧边栏。
 * 输入：插件实例。
 * 输出：去重后的文献条目数组。
 */
export function getBibEntries(plugin) {
  const hadMergedEntries = plugin.bibStore.hasMergedEntries();
  const entries = plugin.bibStore.getEntries();
  if (!hadMergedEntries && plugin.bibStore.hasMergedEntries()) {
    plugin.scheduleSidebarRefresh();
  }
  return entries;
}
