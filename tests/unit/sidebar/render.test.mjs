import test from "node:test";
import assert from "node:assert/strict";

import {
  collectTextContent,
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const coreSymbol = Symbol.for("typora-plugin-core@v2");
globalThis.window[coreSymbol] = {
  SidebarPanel: class SidebarPanel {
    addRibbonButton(config) {
      this.ribbonConfig = config;
    }
  },
  Notice: class Notice {},
};

const { BibCitationSidebarPanel } = await import(createFreshModuleUrl("src/sidebar/panel.js"));

function createPlugin(overrides = {}) {
  return {
    manifest: { id: "bibtex-citation" },
    i18n: {
      t: {
        settings: {
          pathBase: { markdown: "Markdown", typora: "Typora", absolute: "Absolute" },
        },
        sidebar: {
          title: "BibTeX",
          pathBaseLabel: "Path Base",
          cslFileLabel: "CSL File",
          configuredFilesLabel: "Configured",
          indexedEntriesLabel: "Indexed",
          citedEntriesLabel: "Cited",
          refreshButton: "Refresh",
          renderButton: "Render",
          restoreButton: "Restore",
          insertBibliographyButton: "Upsert Bib",
          removeBibliographyButton: "Remove Bib",
          unavailable: "Unavailable",
          filesTitle: "Files",
          empty: "Empty",
          loadErrorPrefix: "Load error: ",
          invalidCitationPrefix: "Invalid key: ",
          invalidCitationBlockPrefix: "Invalid block: ",
          citationCountFormat: "{unique} / {total}",
        },
      },
    },
    settings: {
      get(key) {
        const map = {
          bibFiles: "a.bib\nb.bib",
          cslFile: "./styles/apa.csl",
          pathBase: "markdown",
        };
        return map[key] || "";
      },
    },
    getBibEntries() {
      return [{ key: "a" }, { key: "b" }];
    },
    getCurrentDocumentCitationState() {
      return { counts: { unique: 2, total: 3 }, error: null };
    },
    ...overrides,
  };
}

test("BibCitationSidebarPanel.render 在 allowLibraryLoad=false 时显示 unavailable，并渲染路径列表和按钮", () => {
  const panel = new BibCitationSidebarPanel(createPlugin());
  panel.render({ allowLibraryLoad: false });

  const text = collectTextContent(panel.containerEl);
  assert.match(text, /Path Base/);
  assert.match(text, /Unavailable/);
  assert.match(text, /a\.bib/);
  assert.match(text, /b\.bib/);
  assert.match(text, /Refresh/);
  assert.doesNotMatch(text, /Render hint|Trigger|Count hint/);
});

test("BibCitationSidebarPanel.render 在 citationState 出错时显示错误摘要", () => {
  const panel = new BibCitationSidebarPanel(createPlugin({
    getCurrentDocumentCitationState() {
      return {
        counts: { unique: 0, total: 0 },
        error: { type: "invalid-block", blockText: "[@alpha, p. 3]" },
      };
    },
  }));
  panel.render();

  assert.match(collectTextContent(panel.containerEl), /Invalid block: \[@alpha, p\. 3\]/);
});
