import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
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
      this.options = options;
      this.t = options.resources?.[options.userLang] || options.resources?.zh || {};
    }
  },
};

const {
  CITATION_END_MARKER,
  CITATION_START_MARKER,
  escapeControlledCitationPayload,
} = await import(createFreshModuleUrl("src/csl/controlled-citations.js"));
const { default: BibCitationPlugin } = await import(createFreshModuleUrl("src/plugin.js"));

function createControlledCitation(rawBlock, rendered = "(Rendered)") {
  return `${CITATION_START_MARKER}${escapeControlledCitationPayload(rawBlock)} -->${rendered}${CITATION_END_MARKER}`;
}

function createPluginContext(markdown, entryKeys = ["alpha"]) {
  globalThis.window.editor = {
    getMarkdown() {
      return markdown;
    },
  };

  const plugin = new BibCitationPlugin();
  plugin.i18n = {
    t: {
      sidebar: {
        invalidCitationPrefix: "Unknown: ",
        invalidCitationBlockPrefix: "Invalid block: ",
      },
    },
  };
  plugin.getBibEntries = () => entryKeys.map((key) => ({ key }));
  return plugin;
}

test("ensureNoInvalidCitationKeysForCslAction 对合法文档不抛错", () => {
  const plugin = createPluginContext("ok [@alpha; @beta]", ["alpha", "beta"]);
  assert.doesNotThrow(() => plugin.ensureNoInvalidCitationKeysForCslAction());
});

test("ensureNoInvalidCitationKeysForCslAction 遇到未知 key 时抛出带 key 的错误", () => {
  const plugin = createPluginContext("bad [@alpha; @unknown]", ["alpha"]);

  assert.throws(
    () => plugin.ensureNoInvalidCitationKeysForCslAction(),
    /Unknown: unknown/,
  );
});

test("ensureNoInvalidCitationKeysForCslAction 遇到非法 block 时抛出摘要错误", () => {
  const plugin = createPluginContext("bad [@alpha, p. 3]", ["alpha"]);

  assert.throws(
    () => plugin.ensureNoInvalidCitationKeysForCslAction(),
    /Invalid block: \[@alpha, p\. 3\]/,
  );
});

test("ensureNoInvalidCitationKeysForCslAction 也会拦截受控 citation 块中的非法原始内容", () => {
  const plugin = createPluginContext(createControlledCitation("[see @alpha]"), ["alpha"]);

  assert.throws(
    () => plugin.ensureNoInvalidCitationKeysForCslAction(),
    /Invalid block: \[see @alpha\]/,
  );
});
