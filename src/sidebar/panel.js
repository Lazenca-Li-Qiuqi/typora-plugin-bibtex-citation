const { Notice, SidebarPanel } = window[Symbol.for("typora-plugin-core@v2")];

import { FILE_SOURCE_TYPE } from "../constants.js";
import { parseBibFileList, parseSingleFileConfig } from "../bibtex/settings.js";
import { summarizeText } from "../utils/html.js";

/**
 * 功能：提供 BibTeX 配置概览侧边栏，并在活动栏注册入口按钮。
 * 输入：插件实例，用于读取设置与触发缓存刷新。
 * 输出：可注册到 Typora 侧边栏的面板实例。
 */
export class BibCitationSidebarPanel extends SidebarPanel {
  constructor(plugin) {
    super();
    this.plugin = plugin;
    this.containerEl = document.createElement("section");
    this.containerEl.className = "bibtex-sidebar-panel";

    this.addRibbonButton({
      id: `${plugin.manifest.id}.sidebar`,
      title: plugin.i18n.t.sidebar.title,
      icon: createRibbonIcon(),
      className: "bibtex-sidebar-ribbon-button",
    });
  }

  /**
   * 功能：在面板显示时按最新设置重新渲染概览内容。
   * 输入：无。
   * 输出：无返回值。
   */
  onshow() {
    this.render();
  }

  /**
   * 功能：根据当前配置、缓存状态与 BibTeX 解析结果构建面板内容。
   * 输入：无。
   * 输出：无返回值。
   */
  render(options = {}) {
    const { allowLibraryLoad = true } = options;
    const t = this.plugin.i18n.t.sidebar;
    const paths = parseBibFileList(this.plugin.settings.get("bibFiles"));
    const cslFile = parseSingleFileConfig(this.plugin.settings.get("cslFile"));

    let entryCount = 0;
    let loadError = "";
    let citationState = { counts: { unique: 0, total: 0 }, error: "" };

    if (allowLibraryLoad) {
      try {
        entryCount = this.plugin.getBibEntries().length;
        citationState = this.plugin.getCurrentDocumentCitationState();
      } catch (error) {
        loadError = error?.message || String(error);
      }
    } else {
      entryCount = null;
    }

    const sections = [
      createSummaryGrid([
        [t.cslFileLabel, formatFileConfigLabel(cslFile, this.plugin.i18n.t.settings.fileSourceType, t.unavailable)],
        [t.configuredFilesLabel, String(paths.length)],
        [t.indexedEntriesLabel, loadError || entryCount === null ? t.unavailable : String(entryCount)],
        [
          t.citedEntriesLabel,
          citationState.error
            ? t.unavailable
            : formatCitationCount(t.citationCountFormat, citationState.counts),
        ],
      ]),
      createActions([
        { label: t.refreshButton, onClick: () => this.handleRefresh() },
        {
          label: t.renderButton,
          onClick: () => this.handleRenderCitations(),
          className: "bibtex-sidebar-button-wide",
        },
        {
          label: t.restoreButton,
          onClick: () => this.handleRestoreCitations(),
          className: "bibtex-sidebar-button-narrow",
        },
        {
          label: t.insertBibliographyButton,
          onClick: () => this.handleUpsertBibliography(),
          className: "bibtex-sidebar-button-wide",
        },
        {
          label: t.removeBibliographyButton,
          onClick: () => this.handleRemoveBibliography(),
          className: "bibtex-sidebar-button-narrow",
        },
      ]),
      loadError ? createError(t.loadErrorPrefix + loadError) : null,
      citationState.error ? createError(formatCitationStateError(t, citationState.error)) : null,
      paths.length
        ? createPathList(paths, t.filesTitle, this.plugin.i18n.t.settings.fileSourceType)
        : createEmpty(t.empty),
    ].filter(Boolean);

    this.containerEl.innerHTML = "";
    this.containerEl.append(...sections);
  }

  /**
   * 功能：清空缓存并立刻刷新面板展示。
   * 说明：这里走的是手动强制重读路径，会直接调用 `reloadLibraryNow()`。
   * 输入：无。
   * 输出：无返回值。
   */
  handleRefresh() {
    this.plugin.reloadLibraryNow();
  }

  /**
   * 功能：将当前文档中的严格合法 CSL 引用块渲染为文中引用文本。
   * 输入：无。
   * 输出：无返回值。
   */
  async handleRenderCitations() {
    try {
      const result = await this.plugin.renderCurrentDocumentCitations();
      if (!result.changed) {
        new Notice(this.plugin.i18n.t.sidebar.renderNoChanges);
        return;
      }

      new Notice(
        this.plugin.i18n.t.sidebar.renderSuccess
          .replace("{blocks}", String(result.renderedBlocks))
          .replace("{keys}", String(result.renderedKeys)),
      );
    } catch (error) {
      new Notice(this.plugin.i18n.t.sidebar.renderErrorPrefix + (error?.message || String(error)));
    }
  }

  /**
   * 功能：把当前文档中的受控 citation 块恢复为原始 `[@key]` 文本。
   * 输入：无。
   * 输出：无返回值。
   */
  async handleRestoreCitations() {
    try {
      const result = await this.plugin.restoreCurrentDocumentCitations();
      if (!result.changed) {
        new Notice(this.plugin.i18n.t.sidebar.restoreNoChanges);
        return;
      }

      new Notice(
        this.plugin.i18n.t.sidebar.restoreSuccess
          .replace("{blocks}", String(result.renderedBlocks))
          .replace("{keys}", String(result.renderedKeys)),
      );
    } catch (error) {
      new Notice(this.plugin.i18n.t.sidebar.restoreErrorPrefix + (error?.message || String(error)));
    }
  }

  /**
   * 功能：根据当前文档中的合法 citation key 生成或更新参考文献块。
   * 输入：无。
   * 输出：无返回值。
   */
  async handleUpsertBibliography() {
    try {
      const result = await this.plugin.upsertCurrentDocumentBibliography();
      if (!result.changed) {
        new Notice(this.plugin.i18n.t.sidebar.insertBibliographyNoChanges);
        return;
      }

      new Notice(
        this.plugin.i18n.t.sidebar.insertBibliographySuccess
          .replace("{keys}", String(result.keyCount)),
      );
    } catch (error) {
      new Notice(
        this.plugin.i18n.t.sidebar.insertBibliographyErrorPrefix +
          (error?.message || String(error)),
      );
    }
  }

  /**
   * 功能：删除当前文档中由本插件生成的受控参考文献块。
   * 输入：无。
   * 输出：无返回值。
   */
  async handleRemoveBibliography() {
    try {
      const result = await this.plugin.removeCurrentDocumentBibliography();
      if (!result.changed) {
        new Notice(this.plugin.i18n.t.sidebar.removeBibliographyNoChanges);
        return;
      }

      new Notice(this.plugin.i18n.t.sidebar.removeBibliographySuccess);
    } catch (error) {
      new Notice(
        this.plugin.i18n.t.sidebar.removeBibliographyErrorPrefix +
          (error?.message || String(error)),
      );
    }
  }
}

function createRibbonIcon() {
  const icon = document.createElement("span");
  icon.className = "bibtex-sidebar-ribbon-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "“";
  return icon;
}

function createSummaryGrid(items) {
  const wrapper = document.createElement("dl");
  wrapper.className = "bibtex-sidebar-summary";

  for (const [label, value] of items) {
    const row = document.createElement("div");
    row.className = "bibtex-sidebar-summary-row";

    const dt = document.createElement("dt");
    dt.textContent = label;

    const dd = document.createElement("dd");
    dd.textContent = value;

    row.append(dt, dd);
    wrapper.append(row);
  }

  return wrapper;
}

function createActions(actions) {
  const wrapper = document.createElement("div");
  wrapper.className = "bibtex-sidebar-actions";

  for (const action of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-default bibtex-sidebar-button";
    if (action.className) {
      button.classList.add(action.className);
    }
    button.textContent = action.label;
    button.addEventListener("click", action.onClick);
    wrapper.append(button);
  }

  return wrapper;
}

function createError(text) {
  const el = document.createElement("p");
  el.className = "bibtex-sidebar-error";
  el.textContent = text;
  return el;
}

function createEmpty(text) {
  const el = document.createElement("p");
  el.className = "bibtex-sidebar-empty";
  el.textContent = text;
  return el;
}

function createPathList(paths, titleText, sourceTypeLabels) {
  const wrapper = document.createElement("div");
  wrapper.className = "bibtex-sidebar-section";

  const title = document.createElement("h4");
  title.className = "bibtex-sidebar-subtitle";
  title.textContent = titleText;

  const list = document.createElement("ol");
  list.className = "bibtex-sidebar-path-list";

  for (const pathConfig of paths) {
    const item = document.createElement("li");
    item.className = "bibtex-sidebar-path-item";
    const text = formatFileConfigLabel(pathConfig, sourceTypeLabels, "");
    item.textContent = text;
    item.title = text;
    list.append(item);
  }

  wrapper.append(title, list);
  return wrapper;
}

function formatFileConfigLabel(fileConfig, labels, fallback) {
  if (!fileConfig?.path || !fileConfig?.sourceType) {
    return fallback;
  }

  return `${fileConfig.path} (${getSourceTypeLabel(fileConfig.sourceType, labels)})`;
}

function getSourceTypeLabel(sourceType, labels) {
  switch (sourceType) {
    case FILE_SOURCE_TYPE.TYPORA_RELATIVE:
      return labels.typoraRelative;
    case FILE_SOURCE_TYPE.ABSOLUTE:
      return labels.absolute;
    case FILE_SOURCE_TYPE.MARKDOWN_RELATIVE:
    default:
      return labels.markdownRelative;
  }
}

function formatCitationCount(template, counts) {
  return String(template)
    .replace("{unique}", String(counts.unique))
    .replace("{total}", String(counts.total));
}

function formatCitationStateError(texts, error) {
  if (!error) {
    return "";
  }

  if (error.type === "unknown-key") {
    return texts.invalidCitationPrefix + error.key;
  }

  return texts.invalidCitationBlockPrefix + summarizeText(error.blockText);
}
