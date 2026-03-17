import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { toCslItem } = await import(createFreshModuleUrl("src/csl/item.js"));

test("toCslItem 正确映射 article 及常见字段", () => {
  const item = toCslItem({
    key: "smith2024",
    type: "article",
    title: "Forecast Skill",
    authors: "Smith, John",
    editors: "",
    year: "2024",
    journal: "Weather Journal",
    doi: "10.1000/example",
    publisher: "",
    institution: "",
    volume: "12",
    issue: "3",
    pages: "1-9",
  });

  assert.equal(item.id, "smith2024");
  assert.equal(item.type, "article-journal");
  assert.deepEqual(item.author, [{ family: "Smith", given: "John" }]);
  assert.deepEqual(item.issued, { "date-parts": [[2024]] });
  assert.equal(item["container-title"], "Weather Journal");
  assert.equal(item.DOI, "10.1000/example");
  assert.equal(item.volume, "12");
  assert.equal(item.issue, "3");
  assert.equal(item.page, "1-9");
});

test("toCslItem 正确映射 conference 与 booktitle", () => {
  const item = toCslItem({
    key: "conf2024",
    type: "inproceedings",
    title: "Assimilation Study",
    authors: "Jane Doe",
    editors: "",
    year: "2024",
    journal: "Should Not Win",
    booktitle: "Proceedings of HPC Weather",
    doi: "",
    publisher: "",
    institution: "",
    volume: "",
    issue: "",
    pages: "",
  });

  assert.equal(item.type, "paper-conference");
  assert.equal(item["container-title"], "Proceedings of HPC Weather");
  assert.deepEqual(item.author, [{ family: "Doe", given: "Jane" }]);
});

test("toCslItem 把机构作者映射为 literal", () => {
  const item = toCslItem({
    key: "team2024",
    type: "report",
    title: "Team Report",
    authors: "{ECMWF Research Team}",
    editors: "",
    year: "2024",
    journal: "",
    booktitle: "",
    doi: "",
    publisher: "",
    institution: "ECMWF",
    volume: "",
    issue: "",
    pages: "",
  });

  assert.deepEqual(item.author, [{ literal: "ECMWF Research Team" }]);
  assert.equal(item.type, "report");
  assert.equal(item.publisher, "ECMWF");
});

test("toCslItem 支持多作者与 editor 字段", () => {
  const item = toCslItem({
    key: "chapter2024",
    type: "incollection",
    title: "Chapter Title",
    authors: "Smith, John and Jane Doe and {NOAA Team}",
    editors: "Brown, Alice and Bob Ray",
    year: "2024",
    journal: "",
    booktitle: "Collected Works",
    doi: "",
    publisher: "Science Press",
    institution: "",
    volume: "",
    issue: "",
    pages: "10-20",
  });

  assert.deepEqual(item.author, [
    { family: "Smith", given: "John" },
    { family: "Doe", given: "Jane" },
    { literal: "NOAA Team" },
  ]);
  assert.deepEqual(item.editor, [
    { family: "Brown", given: "Alice" },
    { family: "Ray", given: "Bob" },
  ]);
  assert.equal(item.type, "chapter");
});

test("toCslItem 对无法抽取年份的日期使用 literal", () => {
  const item = toCslItem({
    key: "draft",
    type: "manual",
    title: "Draft Manual",
    authors: "Smith, John",
    editors: "",
    year: "Spring 2024 draft",
    journal: "",
    booktitle: "",
    doi: "",
    publisher: "Lab",
    institution: "",
    volume: "",
    issue: "",
    pages: "",
  });

  assert.deepEqual(item.issued, { "date-parts": [[2024]] });
});

test("toCslItem 对完全非数字日期使用 literal 并回退未知类型", () => {
  const item = toCslItem({
    key: "mystery",
    type: "misc",
    title: "Mystery Note",
    authors: "Solo",
    editors: "",
    year: "forthcoming",
    journal: "",
    booktitle: "",
    doi: "",
    publisher: "",
    institution: "",
    volume: "",
    issue: "",
    pages: "",
  });

  assert.equal(item.type, "article");
  assert.deepEqual(item.author, [{ literal: "Solo" }]);
  assert.deepEqual(item.issued, { literal: "forthcoming" });
});
