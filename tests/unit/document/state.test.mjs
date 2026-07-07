import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { CurrentDocumentState } = await import(createFreshModuleUrl("src/document/state.js"));
const {
  CITATION_END_MARKER,
  CITATION_START_MARKER,
  escapeControlledCitationPayload,
} = await import(createFreshModuleUrl("src/csl/controlled-citations.js"));

function createControlledCitation(rawBlock, rendered = "(Rendered)") {
  return `${CITATION_START_MARKER}${escapeControlledCitationPayload(rawBlock)} -->${rendered}${CITATION_END_MARKER}`;
}

test("CurrentDocumentState 对空文档返回空统计且无错误", () => {
  const state = new CurrentDocumentState();
  const result = state.getCitationState("", new Set(["alpha"]));

  assert.deepEqual(result, {
    counts: { unique: 0, total: 0 },
    error: null,
  });
});

test("CurrentDocumentState 能统计正文中的单个 citation block", () => {
  const state = new CurrentDocumentState();
  const result = state.getCitationState("text [@alpha]", new Set(["alpha"]));

  assert.deepEqual(result, {
    counts: { unique: 1, total: 1 },
    error: null,
  });
});

test("CurrentDocumentState 能统计正文中多块多 key 的引用", () => {
  const state = new CurrentDocumentState();
  const markdown = "A [@alpha; @beta]\nB [@beta]\nC [@gamma]";
  const result = state.getCitationState(markdown, new Set(["alpha", "beta", "gamma"]));

  assert.deepEqual(result, {
    counts: { unique: 3, total: 4 },
    error: null,
  });
});

test("CurrentDocumentState 能从受控 citation 块统计原始 key", () => {
  const state = new CurrentDocumentState();
  const markdown = createControlledCitation("[@alpha; @beta]");
  const result = state.getCitationState(markdown, new Set(["alpha", "beta"]));

  assert.deepEqual(result, {
    counts: { unique: 2, total: 2 },
    error: null,
  });
});

test("CurrentDocumentState 能统计 visible 与 controlled 混合引用源", () => {
  const state = new CurrentDocumentState();
  const markdown = [
    "Visible [@alpha]",
    createControlledCitation("[@beta; @alpha]"),
    "Tail [@gamma]",
  ].join("\n");
  const result = state.getCitationState(markdown, new Set(["alpha", "beta", "gamma"]));

  assert.deepEqual(result, {
    counts: { unique: 3, total: 4 },
    error: null,
  });
});

test("CurrentDocumentState 遇到未知 key 时返回错误并清零计数", () => {
  const state = new CurrentDocumentState();
  const result = state.getCitationState("text [@alpha; @unknown]", new Set(["alpha"]));

  assert.deepEqual(result, {
    counts: { unique: 0, total: 0 },
    error: {
      type: "unknown-key",
      key: "unknown",
      blockText: "[@alpha; @unknown]",
    },
  });
});

test("CurrentDocumentState 遇到非法 citation block 时返回错误并清零计数", () => {
  const state = new CurrentDocumentState();
  const result = state.getCitationState("text [@alpha, p. 3]", new Set(["alpha"]));

  assert.deepEqual(result, {
    counts: { unique: 0, total: 0 },
    error: {
      type: "invalid-block",
      blockText: "[@alpha, p. 3]",
    },
  });
});

test("CurrentDocumentState 对相同 markdown 复用缓存结果对象", () => {
  const state = new CurrentDocumentState();
  const markdown = "text [@alpha]";
  const validKeys = new Set(["alpha"]);

  const first = state.getCitationState(markdown, validKeys);
  const second = state.getCitationState(markdown, validKeys);

  assert.strictEqual(second.counts, first.counts);
  assert.strictEqual(second.error, first.error);
});
