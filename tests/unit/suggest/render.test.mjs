import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { renderBibSuggestion } = await import(createFreshModuleUrl("src/suggest/render.js"));

test("renderBibSuggestion 渲染标题、作者、年份、期刊和 DOI", () => {
  const html = renderBibSuggestion({
    key: "smith2024",
    title: "Forecast Skill",
    authors: "Smith, John and Doe, Jane",
    year: "2024",
    journal: "Weather Journal",
    doi: "10.1000/example",
  });

  assert.match(html, /data-bibtex-key="smith2024"/);
  assert.match(html, /Forecast Skill/);
  assert.match(html, /2024/);
  assert.match(html, /Smith and Doe/);
  assert.match(html, /Weather Journal/);
  assert.match(html, /10\.1000\/example/);
});

test("renderBibSuggestion 对 HTML 特殊字符做转义", () => {
  const html = renderBibSuggestion({
    key: `bad"key`,
    title: "<Unsafe>",
    authors: "Alpha and Beta",
    year: "",
    journal: "A & B Journal",
    doi: "10.1000/a&b",
  });

  assert.match(html, /&lt;Unsafe&gt;/);
  assert.match(html, /A &amp; B Journal/);
  assert.match(html, /10\.1000\/a&amp;b/);
  assert.match(html, /data-bibtex-key="bad&quot;key"/);
});
