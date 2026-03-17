import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  createMockElement,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const notices = [];
const coreSymbol = Symbol.for("typora-plugin-core@v2");
globalThis.window[coreSymbol] = {
  SidebarPanel: class SidebarPanel {
    addRibbonButton(config) {
      this.ribbonConfig = config;
    }
  },
  Notice: class Notice {
    constructor(message) {
      notices.push(message);
    }
  },
};

const { BibCitationSidebarPanel } = await import(createFreshModuleUrl("src/sidebar/panel.js"));

function createPlugin(overrides = {}) {
  return {
    manifest: { id: "bibtex-citation" },
    i18n: {
      t: {
        sidebar: {
          title: "BibTeX",
          renderNoChanges: "No render changes",
          renderSuccess: "Rendered {blocks} / {keys}",
          renderErrorPrefix: "Render failed: ",
          restoreNoChanges: "No restore changes",
          restoreSuccess: "Restored {blocks} / {keys}",
          restoreErrorPrefix: "Restore failed: ",
          insertBibliographyNoChanges: "No bib changes",
          insertBibliographySuccess: "Updated {keys}",
          insertBibliographyErrorPrefix: "Bib failed: ",
          removeBibliographyNoChanges: "No remove changes",
          removeBibliographySuccess: "Removed bibliography",
          removeBibliographyErrorPrefix: "Remove failed: ",
        },
      },
    },
    async renderCurrentDocumentCitations() {
      return { changed: true, renderedBlocks: 2, renderedKeys: 3 };
    },
    async restoreCurrentDocumentCitations() {
      return { changed: true, renderedBlocks: 1, renderedKeys: 1 };
    },
    async upsertCurrentDocumentBibliography() {
      return { changed: true, keyCount: 4 };
    },
    async removeCurrentDocumentBibliography() {
      return { changed: true };
    },
    ...overrides,
  };
}

test("BibCitationSidebarPanel handle* 方法在成功、无改动和失败时提示正确消息", async () => {
  notices.length = 0;
  const panel = new BibCitationSidebarPanel(createPlugin());
  panel.containerEl = createMockElement("section");

  await panel.handleRenderCitations();
  await panel.handleRestoreCitations();
  await panel.handleUpsertBibliography();
  await panel.handleRemoveBibliography();

  assert.deepEqual(notices, [
    "Rendered 2 / 3",
    "Restored 1 / 1",
    "Updated 4",
    "Removed bibliography",
  ]);

  notices.length = 0;
  const unchanged = new BibCitationSidebarPanel(createPlugin({
    async renderCurrentDocumentCitations() { return { changed: false }; },
    async restoreCurrentDocumentCitations() { return { changed: false }; },
    async upsertCurrentDocumentBibliography() { return { changed: false }; },
    async removeCurrentDocumentBibliography() { return { changed: false }; },
  }));
  unchanged.containerEl = createMockElement("section");
  await unchanged.handleRenderCitations();
  await unchanged.handleRestoreCitations();
  await unchanged.handleUpsertBibliography();
  await unchanged.handleRemoveBibliography();

  assert.deepEqual(notices, [
    "No render changes",
    "No restore changes",
    "No bib changes",
    "No remove changes",
  ]);

  notices.length = 0;
  const failing = new BibCitationSidebarPanel(createPlugin({
    async renderCurrentDocumentCitations() { throw new Error("x"); },
    async restoreCurrentDocumentCitations() { throw new Error("y"); },
    async upsertCurrentDocumentBibliography() { throw new Error("z"); },
    async removeCurrentDocumentBibliography() { throw new Error("w"); },
  }));
  failing.containerEl = createMockElement("section");
  await failing.handleRenderCitations();
  await failing.handleRestoreCitations();
  await failing.handleUpsertBibliography();
  await failing.handleRemoveBibliography();

  assert.deepEqual(notices, [
    "Render failed: x",
    "Restore failed: y",
    "Bib failed: z",
    "Remove failed: w",
  ]);
});
