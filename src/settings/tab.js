const { SettingTab, Notice } = window[Symbol.for("typora-plugin-core@v2")];

import { DISPLAY_LANGUAGE, FILE_SOURCE_TYPE } from "../constants.js";
import { isFileConfigShapeValid } from "../bibtex/path-resolver.js";
import {
  createFileConfig,
  parseBibFileList,
  parseSingleFileConfig,
  serializeBibFileList,
  serializeSingleFileConfig,
} from "../bibtex/settings.js";

/**
 * 功能：渲染并维护插件设置页中的文件来源类别与 BibTeX 文件列表。
 * 输入：构造时接收插件实例。
 * 输出：供插件注册的 SettingTab 子类实例。
 */
export class BibCitationSettingTab extends SettingTab {
  constructor(plugin) {
    super();
    this.plugin = plugin;
    this.sectionState = {
      bibFiles: false,
      cslFile: false,
    };
  }

  get name() {
    return this.plugin.i18n.t.pluginName;
  }

  onload() {
    this.render();
  }

  render() {
    const t = this.plugin.i18n.t;
    const plugin = this.plugin;
    const container = this.containerEl || this.contentEl || this.tabContentEl;

    container.empty?.();
    if (!container.empty) {
      container.innerHTML = "";
    }

    this.addSetting((s) => {
      s.addName(t.settings.language.name);
      s.addDescription(t.settings.language.desc);
      s.addSelect((select) => {
        const options = [
          [DISPLAY_LANGUAGE.EN, t.settings.language.en],
          [DISPLAY_LANGUAGE.ZH_CN, t.settings.language.zhCn],
        ];
        const selectEl = $(select);
        select.className = [select.className, "bibtex-setting-select"]
          .filter(Boolean)
          .join(" ");
        options.forEach(([value, label]) => {
          selectEl.append(
            $("<option>")
              .attr("value", value)
              .text(label),
          );
        });
        selectEl.val(plugin.settings.get("displayLanguage"));
        selectEl.on("change", (event) => {
          const value = $(event.target).val();
          plugin.settings.set("displayLanguage", value);
          plugin.refreshI18n();
          plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
          this.render();
          new Notice(plugin.i18n.t.settingsSaved);
        });
      });
    });

    const listHost = createDisclosureSection(
      container,
      t.settings.bibFiles.name,
      t.settings.bibFiles.desc,
      this.sectionState.bibFiles,
      (nextOpen) => {
        this.sectionState.bibFiles = nextOpen;
      },
    );
    listHost.classList.add("bibtex-setting-list");

    const bibFiles = parseBibFileList(plugin.settings.get("bibFiles"));
    if (!bibFiles.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "bibtex-setting-empty";
      emptyState.textContent = t.settings.bibFiles.empty;
      listHost.appendChild(emptyState);
    }

    bibFiles.forEach((bibFile, index) => {
      const row = document.createElement("div");
      row.className = "bibtex-setting-row";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "bibtex-setting-input";
      input.value = bibFile.path;
      input.placeholder = t.settings.bibFiles.placeholder;
      const sourceTypeSelect = createSourceTypeSelect(t, bibFile.sourceType);

      const saveBibFile = () => {
        const nextFiles = parseBibFileList(plugin.settings.get("bibFiles"));
        const nextConfig = createFileConfig(
          input.value,
          sourceTypeSelect.value,
        );
        if (!isFileConfigShapeValid(nextConfig)) {
          new Notice(t.invalidFileConfig + input.value.trim());
          input.value = bibFile.path;
          sourceTypeSelect.value = bibFile.sourceType;
          return;
        }

        nextFiles[index] = nextConfig;
        plugin.settings.set("bibFiles", serializeBibFileList(nextFiles));
        plugin.invalidateLibrary();
        plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
        this.render();
        new Notice(t.settingsSaved);
      };

      input.addEventListener("change", saveBibFile);
      sourceTypeSelect.addEventListener("change", saveBibFile);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "bibtex-setting-remove";
      removeButton.textContent = t.settings.bibFiles.remove;
      removeButton.addEventListener("click", () => {
        const nextFiles = parseBibFileList(plugin.settings.get("bibFiles"));
        nextFiles.splice(index, 1);
        plugin.settings.set("bibFiles", serializeBibFileList(nextFiles));
        plugin.invalidateLibrary();
        plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
        this.render();
        new Notice(t.settingsSaved);
      });

      row.appendChild(input);
      row.appendChild(sourceTypeSelect);
      row.appendChild(removeButton);
      listHost.appendChild(row);
    });

    const addRow = document.createElement("div");
    addRow.className = "bibtex-setting-add-row";

    const addInput = document.createElement("input");
    addInput.type = "text";
    addInput.className = "bibtex-setting-input";
    addInput.placeholder = t.settings.bibFiles.placeholder;

    const addSourceTypeSelect = createSourceTypeSelect(
      t,
      FILE_SOURCE_TYPE.MARKDOWN_RELATIVE,
    );

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "bibtex-setting-add";
    addButton.textContent = t.settings.bibFiles.add;
    addButton.addEventListener("click", () => {
      const nextValue = addInput.value.trim();
      if (!nextValue) {
        new Notice(t.emptyPathWarning);
        return;
      }

      const nextConfig = createFileConfig(nextValue, addSourceTypeSelect.value);
      if (!isFileConfigShapeValid(nextConfig)) {
        new Notice(t.invalidFileConfig + nextValue);
        return;
      }

      const nextFiles = parseBibFileList(plugin.settings.get("bibFiles"));
      nextFiles.push(nextConfig);
      plugin.settings.set("bibFiles", serializeBibFileList(nextFiles));
      plugin.invalidateLibrary();
      plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
      this.render();
      new Notice(t.settingsSaved);
    });

    addRow.appendChild(addInput);
    addRow.appendChild(addSourceTypeSelect);
    addRow.appendChild(addButton);
    listHost.appendChild(addRow);

    const cslHost = createDisclosureSection(
      container,
      t.settings.cslFile.name,
      t.settings.cslFile.desc,
      this.sectionState.cslFile,
      (nextOpen) => {
        this.sectionState.cslFile = nextOpen;
      },
    );

    const cslRow = document.createElement("div");
    cslRow.className = "bibtex-setting-row";
    const cslConfig = parseSingleFileConfig(plugin.settings.get("cslFile"));

    const cslInput = document.createElement("input");
    cslInput.type = "text";
    cslInput.className = "bibtex-setting-input";
    cslInput.value = cslConfig?.path || "";
    cslInput.placeholder = t.settings.cslFile.placeholder;

    const cslSourceTypeSelect = createSourceTypeSelect(
      t,
      cslConfig?.sourceType || FILE_SOURCE_TYPE.MARKDOWN_RELATIVE,
    );

    const saveCslFile = () => {
      const trimmedValue = cslInput.value.trim();
      if (!trimmedValue) {
        plugin.settings.set("cslFile", "");
        plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
        this.render();
        new Notice(t.settingsSaved);
        return;
      }

      const nextConfig = createFileConfig(trimmedValue, cslSourceTypeSelect.value);
      if (!isFileConfigShapeValid(nextConfig)) {
        new Notice(t.invalidFileConfig + trimmedValue);
        cslInput.value = cslConfig?.path || "";
        cslSourceTypeSelect.value =
          cslConfig?.sourceType || FILE_SOURCE_TYPE.MARKDOWN_RELATIVE;
        return;
      }

      plugin.settings.set("cslFile", serializeSingleFileConfig(nextConfig));
      plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
      this.render();
      new Notice(t.settingsSaved);
    };

    cslInput.addEventListener("change", saveCslFile);
    cslSourceTypeSelect.addEventListener("change", saveCslFile);

    const cslClearButton = document.createElement("button");
    cslClearButton.type = "button";
    cslClearButton.className = "bibtex-setting-remove";
    cslClearButton.textContent = t.settings.cslFile.clear;
    cslClearButton.addEventListener("click", () => {
      plugin.settings.set("cslFile", "");
      plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
      this.render();
      new Notice(t.settingsSaved);
    });

    cslRow.appendChild(cslInput);
    cslRow.appendChild(cslSourceTypeSelect);
    cslRow.appendChild(cslClearButton);
    cslHost.appendChild(cslRow);
  }
}

function createDisclosureSection(container, title, description, isOpen, onToggle) {
  const section = document.createElement("details");
  section.className = "bibtex-setting-section";
  section.open = Boolean(isOpen);

  const toggle = document.createElement("summary");
  toggle.className = "bibtex-setting-section-toggle";
  toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

  const toggleText = document.createElement("span");
  toggleText.className = "bibtex-setting-section-title";
  toggleText.textContent = title;

  const toggleArrow = document.createElement("span");
  toggleArrow.className = "bibtex-setting-section-arrow";
  toggleArrow.textContent = isOpen ? "▾" : "▸";

  toggle.appendChild(toggleText);
  toggle.appendChild(toggleArrow);
  section.addEventListener("toggle", () => {
    toggle.setAttribute("aria-expanded", section.open ? "true" : "false");
    toggleArrow.textContent = section.open ? "▾" : "▸";
    onToggle(section.open);
  });

  const desc = document.createElement("p");
  desc.className = "bibtex-setting-section-desc";
  desc.textContent = description;

  const body = document.createElement("div");
  body.className = "bibtex-setting-section-body";

  section.appendChild(toggle);
  section.appendChild(desc);
  section.appendChild(body);
  container.appendChild(section);
  return body;
}

function createSourceTypeSelect(t, selectedValue) {
  const select = document.createElement("select");
  select.className = "bibtex-setting-select bibtex-setting-source-type";

  const options = [
    [FILE_SOURCE_TYPE.MARKDOWN_RELATIVE, t.settings.fileSourceType.markdownRelative],
    [FILE_SOURCE_TYPE.TYPORA_RELATIVE, t.settings.fileSourceType.typoraRelative],
    [FILE_SOURCE_TYPE.ABSOLUTE, t.settings.fileSourceType.absolute],
  ];

  for (const [value, label] of options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  select.value = selectedValue || FILE_SOURCE_TYPE.MARKDOWN_RELATIVE;
  return select;
}
