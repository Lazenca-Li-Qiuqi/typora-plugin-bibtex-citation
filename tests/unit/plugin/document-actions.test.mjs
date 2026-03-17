import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  createMockPluginForStyle,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const coreSymbol = Symbol.for("typora-plugin-core@v2");
globalThis.window[coreSymbol] = {
  Plugin: class Plugin {},
  PluginSettings: class PluginSettings {},
  EditorSuggest: class EditorSuggest {},
  SettingTab: class SettingTab {},
  SidebarPanel: class SidebarPanel {},
  Notice: class Notice {},
  I18n: class I18n {
    constructor(options = {}) {
      this.t = options.resources?.[options.userLang] || options.resources?.zh || {};
    }
  },
};

const { default: BibCitationPlugin } = await import(createFreshModuleUrl("src/plugin.js"));
const { ensureCslTemplate } = await import(createFreshModuleUrl("src/csl/assets.js"));

function createPlugin(markdown, styleFile = "apa.csl") {
  const plugin = new BibCitationPlugin();
  const stylePlugin = createMockPluginForStyle(styleFile);
  plugin.settings = {
    get(key) {
      return stylePlugin.settings.get(key);
    },
  };
  plugin.i18n = {
    t: {
      sidebar: {
        renderReloadUnavailable: "reload unavailable",
        bibliographyHeading: "References",
      },
    },
  };
  plugin.sidebarPanel = {
    renderCalls: 0,
    render() {
      this.renderCalls += 1;
    },
  };
  plugin.documentState = {
    clearCalls: 0,
    clear() {
      this.clearCalls += 1;
    },
  };
  plugin.resetDocumentState = function resetDocumentState() {
    this.documentState.clear();
  };
  plugin.ensureNoInvalidCitationKeysForCslAction = () => {};
  plugin.getBibEntries = () => [
    {
      key: "smith2024",
      type: "article",
      title: "Forecast Skill",
      authors: "Smith, John",
      editors: "",
      year: "2024",
      journal: "Weather Journal",
      booktitle: "",
      volume: "",
      issue: "",
      pages: "",
      doi: "",
      publisher: "",
      institution: "",
    },
  ];
  globalThis.window.editor = {
    getMarkdown() {
      return markdown;
    },
  };
  return plugin;
}

test("renderCurrentDocumentCitations 在发生改写时重载文档并刷新状态", async () => {
  const plugin = createPlugin("Text [@smith2024]");
  let reloadArgs = null;
  globalThis.window.File = {
    reloadContent(...args) {
      reloadArgs = args;
    },
  };

  const result = await plugin.renderCurrentDocumentCitations();

  assert.equal(result.changed, true);
  assert.ok(String(reloadArgs?.[0]).includes("bibtex-citation:citation:start"));
  assert.equal(plugin.documentState.clearCalls, 1);
  assert.equal(plugin.sidebarPanel.renderCalls, 1);
});

test("restoreCurrentDocumentCitations 在发生改写时恢复原始 citation", async () => {
  const templateName = ensureCslTemplate(createMockPluginForStyle("apa.csl"));
  const { renderCitationMarkdown } = await import(createFreshModuleUrl("src/csl/render.js"));
  const entries = [{
    key: "smith2024",
    type: "article",
    title: "Forecast Skill",
    authors: "Smith, John",
    editors: "",
    year: "2024",
    journal: "Weather Journal",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  }];
  const rendered = renderCitationMarkdown("Text [@smith2024]", entries, templateName).markdown;
  const plugin = createPlugin(rendered);
  let reloadMarkdown = "";
  globalThis.window.File = {
    reloadContent(markdown) {
      reloadMarkdown = markdown;
    },
  };

  const result = await plugin.restoreCurrentDocumentCitations();

  assert.equal(result.changed, true);
  assert.ok(reloadMarkdown.includes("[@smith2024]"));
  assert.equal(plugin.documentState.clearCalls, 1);
  assert.equal(plugin.sidebarPanel.renderCalls, 1);
});

test("upsertCurrentDocumentBibliography 在发生改写时重载文档", async () => {
  const plugin = createPlugin("Text [@smith2024]");
  let reloadMarkdown = "";
  globalThis.window.File = {
    reloadContent(markdown) {
      reloadMarkdown = markdown;
    },
  };

  const result = await plugin.upsertCurrentDocumentBibliography();

  assert.equal(result.changed, true);
  assert.ok(reloadMarkdown.includes("bibtex-citation:bibliography:start"));
  assert.equal(plugin.documentState.clearCalls, 1);
  assert.equal(plugin.sidebarPanel.renderCalls, 1);
});

test("removeCurrentDocumentBibliography 在无改动时不调用 reloadContent", async () => {
  const plugin = createPlugin("No bibliography here");
  let called = false;
  globalThis.window.File = {
    reloadContent() {
      called = true;
    },
  };

  const result = await plugin.removeCurrentDocumentBibliography();

  assert.equal(result.changed, false);
  assert.equal(called, false);
});
