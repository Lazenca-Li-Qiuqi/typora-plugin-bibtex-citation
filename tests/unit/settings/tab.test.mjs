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

const { DISPLAY_LANGUAGE, PATH_BASE_MODE } = await import(createFreshModuleUrl("src/constants.js"));
const { BibCitationSettingTab } = await import(createFreshModuleUrl("src/settings/tab.js"));

function createPlugin(overrides = {}) {
  const store = new Map([
    ["displayLanguage", DISPLAY_LANGUAGE.ZH_CN],
    ["pathBase", PATH_BASE_MODE.MARKDOWN],
    ["bibFiles", ""],
    ["cslFile", ""],
  ]);
  return {
    i18n: {
      t: {
        pluginName: "BibTeX Citations",
        settingsSaved: "saved",
        emptyPathWarning: "empty path",
        absolutePathRequired: "absolute only",
        settings: {
          language: { name: "Language", desc: "desc", en: "English", zhCn: "简体中文" },
          pathBase: {
            name: "Path Base",
            desc: "desc",
            markdown: "Markdown",
            typora: "Typora",
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

test("BibCitationSettingTab.name 返回插件名称，render 在无 BibTeX 文件时显示 empty state", () => {
  notices.length = 0;
  selectBindings.length = 0;
  const plugin = createPlugin();
  const tab = new BibCitationSettingTab(plugin);

  assert.equal(tab.name, "BibTeX Citations");
  tab.render();

  assert.match(collectTextContent(tab.containerEl), /No files/);
  assert.equal(selectBindings.length >= 2, true);
});

test("BibCitationSettingTab 的语言与路径基准切换会更新设置并刷新视图", () => {
  notices.length = 0;
  selectBindings.length = 0;
  const plugin = createPlugin();
  const tab = new BibCitationSettingTab(plugin);
  tab.render();

  selectBindings[0].trigger("change", DISPLAY_LANGUAGE.EN);
  selectBindings[1].trigger("change", PATH_BASE_MODE.ABSOLUTE);

  assert.equal(plugin.settings.get("displayLanguage"), DISPLAY_LANGUAGE.EN);
  assert.equal(plugin.settings.get("pathBase"), PATH_BASE_MODE.ABSOLUTE);
  assert.equal(plugin.refreshI18nCalls, 1);
  assert.equal(plugin.invalidateLibraryCalls, 1);
  assert.equal(plugin.sidebarPanel.renderCalls.length >= 2, true);
  assert.equal(notices.includes("saved"), true);
});

test("BibCitationSettingTab 的添加、删除与清空 CSL 按钮会更新设置", () => {
  notices.length = 0;
  const plugin = createPlugin({
    settings: {
      store: new Map([
        ["displayLanguage", DISPLAY_LANGUAGE.ZH_CN],
        ["pathBase", PATH_BASE_MODE.MARKDOWN],
        ["bibFiles", "a.bib\nb.bib"],
        ["cslFile", "./styles/apa.csl"],
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

  const rows = tab.containerEl.children.filter((child) => child.className === "bibtex-setting-list")[0];
  const firstRow = rows.children[0];
  const secondRow = rows.children[1];
  firstRow.children[1].dispatch("click");
  assert.equal(plugin.settings.get("bibFiles"), "b.bib");

  const addRow = tab.containerEl.children.find((child) => child.className === "bibtex-setting-add-row");
  addRow.children[0].value = "c.bib";
  addRow.children[1].dispatch("click");
  assert.equal(plugin.settings.get("bibFiles"), "b.bib\nc.bib");

  const cslRow = tab.containerEl.children.find((child) => child.className === "bibtex-setting-row" && child.children[1]?.textContent === "Clear");
  cslRow.children[1].dispatch("click");
  assert.equal(plugin.settings.get("cslFile"), "");
});
