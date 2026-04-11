import test from "node:test";
import assert from "node:assert/strict";

import {
  collectTextContent,
  createFreshModuleUrl,
  createMockElement,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const notices = [];
const selectBindings = [];

function createJQueryWrapper(initialValue = "") {
  return {
    _value: initialValue,
    _handlers: new Map(),
    _options: [],
    append(option) {
      this._options.push(option);
      return this;
    },
    attr(name, value) {
      this[name] = value;
      return this;
    },
    text(value) {
      this._text = value;
      return this;
    },
    val(value) {
      if (typeof value === "undefined") {
        return this._value;
      }
      this._value = value;
      return this;
    },
    on(type, handler) {
      this._handlers.set(type, handler);
      selectBindings.push(this);
      return this;
    },
    trigger(type, value) {
      this._value = value;
      const handler = this._handlers.get(type);
      if (handler) {
        handler({ target: { value } });
      }
    },
  };
}

globalThis.$ = (target) => {
  if (typeof target === "string" && target === "<option>") {
    return createJQueryWrapper();
  }
  const wrapper = createJQueryWrapper(target?.value || "");
  wrapper._target = target;
  return wrapper;
};

const coreSymbol = Symbol.for("typora-plugin-core@v2");
globalThis.window[coreSymbol] = {
  SettingTab: class SettingTab {
    constructor() {
      this.containerEl = createMockElement("section");
      this._settings = [];
    }
    addSetting(builder) {
      const setting = {
        addName(value) {
          this.name = value;
          return this;
        },
        addDescription(value) {
          this.description = value;
          return this;
        },
        addSelect(callback) {
          callback({});
          return this;
        },
      };
      builder(setting);
      this._settings.push(setting);
    }
  },
  Notice: class Notice {
    constructor(message) {
      notices.push(message);
    }
  },
};

const { DISPLAY_LANGUAGE, FILE_SOURCE_TYPE } = await import(
  createFreshModuleUrl("src/constants.js")
);
const { BibCitationSettingTab } = await import(
  createFreshModuleUrl("src/settings/tab.js")
);

function createPlugin(overrides = {}) {
  const store = new Map([
    ["displayLanguage", DISPLAY_LANGUAGE.ZH_CN],
    ["bibFiles", "[]"],
    ["cslFile", ""],
  ]);
  return {
    i18n: {
      t: {
        pluginName: "BibTeX Citations",
        settingsSaved: "saved",
        emptyPathWarning: "empty path",
        invalidFileConfig: "invalid config: ",
        settings: {
          language: { name: "Language", desc: "desc", en: "English", zhCn: "简体中文" },
          fileSourceType: {
            name: "Source Type",
            markdownRelative: "Markdown",
            typoraRelative: "Typora",
            absolute: "Absolute",
          },
          bibFiles: {
            name: "Bib Files",
            desc: "desc",
            add: "Add BibTeX File",
            empty: "No files",
            placeholder: "./references.bib",
            remove: "Remove",
          },
          cslFile: {
            name: "CSL File",
            desc: "desc",
            placeholder: "./styles/apa.csl",
            clear: "Clear",
          },
        },
      },
    },
    settings: {
      get(key) {
        return store.get(key);
      },
      set(key, value) {
        store.set(key, value);
      },
    },
    sidebarPanel: {
      renderCalls: [],
      render(options) {
        this.renderCalls.push(options);
      },
    },
    invalidateLibraryCalls: 0,
    invalidateLibrary() {
      this.invalidateLibraryCalls += 1;
    },
    refreshI18nCalls: 0,
    refreshI18n() {
      this.refreshI18nCalls += 1;
    },
    ...overrides,
  };
}

function findSectionByTitle(container, title) {
  return container.children.find(
    (child) =>
      child.className === "bibtex-setting-section" &&
      child.children[0]?.children[0]?.textContent === title,
  );
}

function openSection(container, title) {
  const section = findSectionByTitle(container, title);
  section.open = true;
  section.dispatch("toggle");
  return section.children[2];
}

test("BibCitationSettingTab.name 返回插件名称，render 在无 BibTeX 文件时显示 empty state", () => {
  notices.length = 0;
  selectBindings.length = 0;
  const plugin = createPlugin();
  const tab = new BibCitationSettingTab(plugin);

  assert.equal(tab.name, "BibTeX Citations");
  tab.render();

  assert.match(collectTextContent(tab.containerEl), /No files/);
  assert.equal(selectBindings.length >= 1, true);
});

test("BibCitationSettingTab 的语言切换会更新设置并刷新视图", () => {
  notices.length = 0;
  selectBindings.length = 0;
  const plugin = createPlugin();
  const tab = new BibCitationSettingTab(plugin);
  tab.render();

  selectBindings[0].trigger("change", DISPLAY_LANGUAGE.EN);

  assert.equal(plugin.settings.get("displayLanguage"), DISPLAY_LANGUAGE.EN);
  assert.equal(plugin.refreshI18nCalls, 1);
  assert.equal(plugin.sidebarPanel.renderCalls.length >= 1, true);
  assert.equal(notices.includes("saved"), true);
});

test("BibCitationSettingTab 的添加、删除与清空 CSL 按钮会更新设置", () => {
  notices.length = 0;
  const plugin = createPlugin({
    settings: {
      store: new Map([
        ["displayLanguage", DISPLAY_LANGUAGE.ZH_CN],
        [
          "bibFiles",
          JSON.stringify([
            { path: "a.bib", sourceType: FILE_SOURCE_TYPE.MARKDOWN_RELATIVE },
            { path: "b.bib", sourceType: FILE_SOURCE_TYPE.ABSOLUTE },
          ]),
        ],
        [
          "cslFile",
          JSON.stringify({
            path: "./styles/apa.csl",
            sourceType: FILE_SOURCE_TYPE.MARKDOWN_RELATIVE,
          }),
        ],
      ]),
      get(key) {
        return this.store.get(key);
      },
      set(key, value) {
        this.store.set(key, value);
      },
    },
  });
  const tab = new BibCitationSettingTab(plugin);
  tab.render();

  const rows = openSection(tab.containerEl, "Bib Files");
  const firstRow = rows.children[0];
  firstRow.children[2].dispatch("click");
  assert.equal(
    plugin.settings.get("bibFiles"),
    JSON.stringify([{ path: "b.bib", sourceType: FILE_SOURCE_TYPE.ABSOLUTE }]),
  );

  const addRow = rows.children.find(
    (child) => child.className === "bibtex-setting-add-row",
  );
  addRow.children[0].value = "c.bib";
  addRow.children[1].value = FILE_SOURCE_TYPE.TYPORA_RELATIVE;
  addRow.children[2].dispatch("click");
  assert.equal(
    plugin.settings.get("bibFiles"),
    JSON.stringify([
      { path: "b.bib", sourceType: FILE_SOURCE_TYPE.ABSOLUTE },
      { path: "c.bib", sourceType: FILE_SOURCE_TYPE.TYPORA_RELATIVE },
    ]),
  );

  const cslHost = openSection(tab.containerEl, "CSL File");
  const cslRow = cslHost.children.find(
    (child) =>
      child.className === "bibtex-setting-row" &&
      child.children[2]?.textContent === "Clear",
  );
  cslRow.children[2].dispatch("click");
  assert.equal(plugin.settings.get("cslFile"), "");
});

test("BibCitationSettingTab 会阻止空路径与 absolute 来源下的相对路径", () => {
  notices.length = 0;
  const plugin = createPlugin({
    settings: {
      store: new Map([
        ["displayLanguage", DISPLAY_LANGUAGE.ZH_CN],
        [
          "bibFiles",
          JSON.stringify([
            { path: "a.bib", sourceType: FILE_SOURCE_TYPE.TYPORA_RELATIVE },
          ]),
        ],
        [
          "cslFile",
          JSON.stringify({
            path: "C:/styles/apa.csl",
            sourceType: FILE_SOURCE_TYPE.ABSOLUTE,
          }),
        ],
      ]),
      get(key) {
        return this.store.get(key);
      },
      set(key, value) {
        this.store.set(key, value);
      },
    },
  });
  const tab = new BibCitationSettingTab(plugin);
  tab.render();

  const rows = openSection(tab.containerEl, "Bib Files");
  const addRow = rows.children.find((child) => child.className === "bibtex-setting-add-row");
  addRow.children[0].value = "";
  addRow.children[2].dispatch("click");
  addRow.children[0].value = "./relative.bib";
  addRow.children[1].value = FILE_SOURCE_TYPE.ABSOLUTE;
  addRow.children[2].dispatch("click");

  const editRow = rows.children[0];
  editRow.children[0].value = "./edited-relative.bib";
  editRow.children[1].value = FILE_SOURCE_TYPE.ABSOLUTE;
  editRow.children[0].dispatch("change");

  assert.equal(notices.includes("empty path"), true);
  assert.equal(notices.includes("invalid config: ./relative.bib"), true);
  assert.equal(notices.includes("invalid config: ./edited-relative.bib"), true);
  assert.equal(
    plugin.settings.get("bibFiles"),
    JSON.stringify([{ path: "a.bib", sourceType: FILE_SOURCE_TYPE.TYPORA_RELATIVE }]),
  );
});
