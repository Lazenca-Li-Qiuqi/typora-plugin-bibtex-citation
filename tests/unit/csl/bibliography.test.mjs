import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  createMockPluginForStyle,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { ensureCslTemplate } = await import(createFreshModuleUrl("src/csl/assets.js"));
const {
  removeBibliographyMarkdown,
  upsertBibliographyMarkdown,
} = await import(createFreshModuleUrl("src/csl/bibliography.js"));
const {
  CITATION_END_MARKER,
  CITATION_START_MARKER,
  escapeControlledCitationPayload,
} = await import(createFreshModuleUrl("src/csl/controlled-citations.js"));

const entries = [
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
  {
    key: "doe2023",
    type: "article",
    title: "Climate Analysis",
    authors: "Doe, Jane",
    editors: "",
    year: "2023",
    journal: "Climate Journal",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
];

function createTemplateName(styleFile = "apa.csl") {
  return ensureCslTemplate(createMockPluginForStyle(styleFile));
}

function createControlledCitation(rawBlock, rendered = "(Rendered)") {
  return `${CITATION_START_MARKER}${escapeControlledCitationPayload(rawBlock)} -->${rendered}${CITATION_END_MARKER}`;
}

test("upsertBibliographyMarkdown 在没有 citation source 时保持原文不变", () => {
  const templateName = createTemplateName();
  const result = upsertBibliographyMarkdown("# Empty\n", entries, templateName, "References");

  assert.equal(result.changed, false);
  assert.equal(result.keyCount, 0);
  assert.equal(result.markdown, "# Empty\n");
});

test("upsertBibliographyMarkdown 能根据 visible citation 插入 bibliography", () => {
  const templateName = createTemplateName();
  const result = upsertBibliographyMarkdown(
    "Intro [@smith2024]\n",
    entries,
    templateName,
    "References",
  );

  assert.equal(result.changed, true);
  assert.equal(result.keyCount, 1);
  assert.match(result.markdown, /<!-- bibtex-citation:bibliography:start -->/);
  assert.match(result.markdown, /## References/);
  assert.match(result.markdown, /Forecast Skill/);
});

test("upsertBibliographyMarkdown 能根据受控 citation 真源插入 bibliography", () => {
  const templateName = createTemplateName();
  const markdown = `${createControlledCitation("[@doe2023]")}\n`;
  const result = upsertBibliographyMarkdown(markdown, entries, templateName, "References");

  assert.equal(result.changed, true);
  assert.equal(result.keyCount, 1);
  assert.match(result.markdown, /Climate Analysis/);
});

test("upsertBibliographyMarkdown 会按首次出现顺序去重 mixed sources", () => {
  const templateName = createTemplateName("ieee.csl");
  const markdown = [
    createControlledCitation("[@doe2023]"),
    "",
    "Text [@smith2024; @doe2023]",
    "",
  ].join("\n");
  const result = upsertBibliographyMarkdown(markdown, entries, templateName, "References");

  assert.equal(result.keyCount, 2);
  assert.ok(result.markdown.indexOf("Climate Analysis") < result.markdown.indexOf("Forecast Skill"));
});

test("upsertBibliographyMarkdown 在已有受控 bibliography 块时执行更新而不是重复追加", () => {
  const templateName = createTemplateName();
  const existing = [
    "Intro [@smith2024]",
    "",
    "<!-- bibtex-citation:bibliography:start -->",
    "## References",
    "",
    "<div>Old Content</div>",
    "<!-- bibtex-citation:bibliography:end -->",
    "",
  ].join("\n");
  const result = upsertBibliographyMarkdown(existing, entries, templateName, "References");

  assert.equal(result.changed, true);
  assert.equal(result.markdown.match(/<!-- bibtex-citation:bibliography:start -->/g)?.length, 1);
  assert.doesNotMatch(result.markdown, /Old Content/);
  assert.match(result.markdown, /Forecast Skill/);
});

test("removeBibliographyMarkdown 只删除插件生成的 bibliography 块", () => {
  const markdown = [
    "## References",
    "",
    "Handwritten content",
    "",
    "<!-- bibtex-citation:bibliography:start -->",
    "## References",
    "",
    "<div>Generated</div>",
    "<!-- bibtex-citation:bibliography:end -->",
    "",
  ].join("\n");
  const result = removeBibliographyMarkdown(markdown);

  assert.equal(result.changed, true);
  assert.match(result.markdown, /Handwritten content/);
  assert.doesNotMatch(result.markdown, /Generated/);
  assert.doesNotMatch(result.markdown, /bibliography:start/);
});
