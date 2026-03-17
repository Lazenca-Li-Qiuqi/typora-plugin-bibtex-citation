const { Plugin } = window[Symbol.for("typora-plugin-core@v2")];

import { DEFAULT_SETTINGS, DISPLAY_LANGUAGE } from "./constants.js";
import { createI18n } from "./i18n.js";
import { BibEntryStore } from "./bibtex/store.js";
import { CurrentDocumentState } from "./document/state.js";
import {
  ensureNoInvalidCitationKeysForCslAction,
  renderCurrentDocumentCitations as renderCurrentDocumentCitationsAction,
  restoreCurrentDocumentCitations as restoreCurrentDocumentCitationsAction,
  upsertCurrentDocumentBibliography as upsertCurrentDocumentBibliographyAction,
  removeCurrentDocumentBibliography as removeCurrentDocumentBibliographyAction,
} from "./plugin/document-actions.js";
import {
  normalizePluginSettings,
  registerPluginRuntime,
} from "./plugin/runtime.js";
import {
  getBibEntries as getBibEntriesRuntime,
  invalidateLibrary as invalidateLibraryRuntime,
  reloadLibraryNow as reloadLibraryNowRuntime,
  scheduleSidebarRefresh as scheduleSidebarRefreshRuntime,
  scheduleCitationStateRefresh as scheduleCitationStateRefreshRuntime,
} from "./plugin/library-runtime.js";
import {
  getCurrentDocumentCitationState as getCurrentDocumentCitationStateRuntime,
  resetDocumentState as resetDocumentStateRuntime,
} from "./plugin/document-state-runtime.js";

/**
 * 功能：作为插件主控类，组合设置页、BibTeX 存储与候选建议模块。
 * 输入：由 Typora Community Plugin Framework 在加载时实例化。
 * 输出：完成插件初始化与生命周期注册的插件对象。
 */
export default class BibCitationPlugin extends Plugin {
  constructor() {
    super(...arguments);
    this.window = window;
    this.i18n = createI18n();
    this.bibStore = new BibEntryStore(this);
    this.documentState = new CurrentDocumentState();
    this._sidebarRefreshScheduled = false;
    this._citationStateRefreshScheduled = false;
  }

  /**
   * 功能：根据当前设置重建国际化实例，供设置页与侧边栏即时切换语言。
   * 输入：无。
   * 输出：无返回值。
   */
  refreshI18n() {
    this.i18n = createI18n(
      this.settings?.get("displayLanguage") || DISPLAY_LANGUAGE.ZH_CN,
    );
  }

  /**
   * 功能：将 BibTeX 文献库标记为失效，等待下一次 `getBibEntries()` 懒加载时重新读取。
   * 说明：这个方法本身不会立即触发文件系统读取，适合设置项变更后的轻量失效通知。
   * 输入：无。
   * 输出：无返回值。
   */
  invalidateLibrary() {
    return invalidateLibraryRuntime(this);
  }

  /**
   * 功能：清空当前 Markdown 文档的轻量状态缓存。
   * 输入：无。
   * 输出：无返回值。
   */
  resetDocumentState() {
    return resetDocumentStateRuntime(this);
  }

  /**
   * 功能：获取当前文档引用统计，并复用轻量状态缓存。
   * 输入：无。
   * 输出：包含唯一条数、总次数与错误信息的对象。
   */
  getCurrentDocumentCitationState() {
    return getCurrentDocumentCitationStateRuntime(this);
  }

  /**
   * 功能：把当前文档中严格合法的 `[@key]` / `[@a; @b]` 引用块渲染为 CSL 文中引用。
   * 输入：无。
   * 输出：返回本次渲染结果与改写统计。
   */
  async renderCurrentDocumentCitations() {
    return renderCurrentDocumentCitationsAction(this);
  }

  /**
   * 功能：把当前文档中的受控 citation 块恢复为原始 `[@key]` 文本。
   * 输入：无。
   * 输出：返回本次恢复结果与统计。
   */
  async restoreCurrentDocumentCitations() {
    return restoreCurrentDocumentCitationsAction(this);
  }

  /**
   * 功能：根据当前文档中的合法 citation key 生成或更新参考文献块。
   * 输入：无。
   * 输出：返回本次插入结果与引用 key 统计。
   */
  async upsertCurrentDocumentBibliography() {
    return upsertCurrentDocumentBibliographyAction(this);
  }

  /**
   * 功能：删除当前文档中由本插件生成的受控参考文献块。
   * 输入：无。
   * 输出：返回本次删除结果。
   */
  async removeCurrentDocumentBibliography() {
    return removeCurrentDocumentBibliographyAction(this);
  }

  /**
   * 功能：在执行 CSL 相关文档改写前，阻止包含非法 citation key 的文档继续处理。
   * 输入：无。
   * 输出：若发现非法 citation key，则抛出错误；否则无返回值。
   */
  ensureNoInvalidCitationKeysForCslAction() {
    return ensureNoInvalidCitationKeysForCslAction(this);
  }

  /**
   * 功能：立即重新加载 BibTeX 文献库，并刷新相关视图。
   * 说明：当前显式入口是侧边栏 `Refresh Cache` 按钮；它会先失效缓存，再主动调用
   * `getBibEntries()` 触发一次同步重读，和单纯的 `invalidateLibrary()` 不同。
   * 输入：无。
   * 输出：无返回值。
   */
  reloadLibraryNow() {
    return reloadLibraryNowRuntime(this);
  }

  /**
   * 功能：在文献库懒加载完成后，异步刷新一次侧边栏，避免状态停留在“待刷新”。
   * 输入：无。
   * 输出：无返回值。
   */
  scheduleSidebarRefresh() {
    return scheduleSidebarRefreshRuntime(this);
  }

  /**
   * 功能：在编辑器中的 `]` 发生输入或删除后，异步重算当前文档引用统计并刷新侧边栏。
   * 输入：无。
   * 输出：无返回值。
   */
  scheduleCitationStateRefresh() {
    return scheduleCitationStateRefreshRuntime(this);
  }

  /**
   * 功能：获取当前可用于检索与展示的 BibTeX 条目列表。
   * 说明：如果文献库此前已被 `invalidateLibrary()` 标记失效，这里会触发一次懒加载重读。
   * 输入：无。
   * 输出：去重后的文献条目数组。
   */
  getBibEntries() {
    return getBibEntriesRuntime(this);
  }

  /**
   * 功能：注册设置、建议器与交互事件，完成插件启动。
   * 输入：无，由宿主在加载阶段调用。
   * 输出：Promise<void>。
   */
  async onload() {
    this.registerSettings(
      new window[Symbol.for("typora-plugin-core@v2")].PluginSettings(
        this.app,
        this.manifest,
        { version: 1 },
      ),
    );
    this.settings.setDefault(DEFAULT_SETTINGS);
    normalizePluginSettings(this);
    this.refreshI18n();
    registerPluginRuntime(this);
  }
}
