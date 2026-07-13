import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const coreSymbol = Symbol.for("typora-plugin-core@v2");
globalThis.window[coreSymbol] = {
  EditorSuggest: class EditorSuggest {},
};

const { BibCitationSuggest } = await import(createFreshModuleUrl("src/suggest/suggest.js"));

const entries = [
  { key: "smith2024", searchText: "smith2024 forecast skill smith 2024" },
  { key: "smith2023", searchText: "smith2023 reanalysis smith 2023" },
  { key: "doe2024", searchText: "doe2024 climate analysis doe 2024" },
];

function createSuggest() {
  return new BibCitationSuggest({}, {
    getBibEntries() {
      return entries;
    },
  });
}

test("BibCitationSuggest.findQuery 支持严格括号式与独立叙述式查询", () => {
  const suggest = createSuggest();
  assert.deepEqual(suggest.findQuery("prefix [@smi"), { isMatched: true, query: "smi" });
  assert.deepEqual(suggest.findQuery("prefix [@a; @do"), { isMatched: true, query: "do" });
  assert.deepEqual(suggest.findQuery("closed [@smi]"), { isMatched: false, query: "" });
  assert.deepEqual(suggest.findQuery("@smi"), { isMatched: true, query: "smi" });
  assert.deepEqual(suggest.findQuery("根据 @smi"), { isMatched: true, query: "smi" });
  assert.deepEqual(suggest.findQuery("根据@smi"), { isMatched: false, query: "" });
  assert.deepEqual(suggest.findQuery("mail@smi"), { isMatched: false, query: "" });
});

test("BibCitationSuggest.getSuggestions 按 key 前缀优先并屏蔽精确命中", () => {
  const suggest = createSuggest();
  assert.deepEqual(
    suggest.getSuggestions("smith").map((item) => item.key),
    ["smith2023", "smith2024"],
  );
  assert.deepEqual(suggest.getSuggestions("smith2024"), []);
});

test("BibCitationSuggest.beforeApply / getSuggestionId / renderSuggestion 返回预期结果", () => {
  const suggest = createSuggest();
  const item = {
    key: "smith2024",
    title: "Forecast Skill",
    authors: "Smith, John",
    year: "2024",
    journal: "Weather Journal",
    doi: "",
    searchText: "",
  };

  assert.equal(suggest.getSuggestionId(item), "smith2024");
  assert.equal(suggest.beforeApply(item), "@smith2024");
  assert.match(suggest.renderSuggestion(item), /Forecast Skill/);
});
