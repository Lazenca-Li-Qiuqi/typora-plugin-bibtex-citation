import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const coreSymbol = Symbol.for("typora-plugin-core@v2");
class BasePlugin {
  constructor() {
    this._registered = [];
    this._settingTabs = [];
    this._markdownSuggests = [];
    this.settings = {
      _store: new Map(),
      setDefault(value) {
        this._default = value;
      },
      get(key) {
        return this._store.get(key);
      },
      set(key, value) {
        this._store.set(key, value);
      },
    };
    this.app = {
      workspace: {
        sidebar: {
          addPanel(panel) {
            return { panel };
          },
        },
      },
    };
    this.manifest = { id: "bibtex-citation" };
  }
  register(value) {
    this._registered.push(value);
    return value;
  }
  registerSettings(value) {
    this._settingsRegistration = value;
  }
  registerSettingTab(value) {
    this._settingTabs.push(value);
  }
  registerMarkdownSugguest(value) {
    this._markdownSuggests.push(value);
  }
  registerDomEvent() {}
}

globalThis.window[coreSymbol] = {
  Plugin: BasePlugin,
  PluginSettings: class PluginSettings {
    constructor(app, manifest, meta) {
      this.app = app;
      this.manifest = manifest;
      this.meta = meta;
    }
  },
  EditorSuggest: class EditorSuggest {},
  SettingTab: class SettingTab {},
  SidebarPanel: class SidebarPanel {
    addRibbonButton() {}
  },
  Notice: class Notice {},
  I18n: class I18n {
    constructor(options = {}) {
      this.t = options.resources?.[options.userLang] || options.resources?.zh || {};
    }
  },
};

const { default: BibCitationPlugin } = await import(createFreshModuleUrl("src/plugin.js"));

test("onload 会注册设置、侧边栏和建议器，并规范化默认设置", async () => {
  const plugin = new BibCitationPlugin();
  plugin.settings.set("bibFiles", " a.bib ;\n b.bib ");
  plugin.settings.set("pathBase", "");
  plugin.settings.set("displayLanguage", "");

  await plugin.onload();

  assert.ok(plugin._settingsRegistration);
  assert.equal(plugin.settings.get("bibFiles"), "a.bib\nb.bib");
  assert.equal(plugin.settings.get("pathBase"), "markdown");
  assert.equal(plugin.settings.get("displayLanguage"), "zh-cn");
  assert.equal(plugin._settingTabs.length, 1);
  assert.equal(plugin._markdownSuggests.length, 1);
  assert.ok(plugin.sidebarPanel);
  assert.ok(plugin._suggest);
});
