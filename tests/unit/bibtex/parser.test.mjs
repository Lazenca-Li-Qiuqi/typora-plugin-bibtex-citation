import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { parseBibEntries } = await import(createFreshModuleUrl("src/bibtex/parser.js"));

test("parseBibEntries 提取常见字段并构造 searchText", () => {
  const content = `@article{smith2024,
  title = { Forecast Skill },
  author = {Smith, John and Doe, Jane},
  year = {2024},
  journal = {Weather Journal},
  doi = {10.1000/example}
}

@inproceedings{conf2023,
  title = "Assimilation Study",
  author = "Wang, Lei",
  editor = "Brown, Alice",
  date = "2023-05-01",
  booktitle = "HPC Weather",
  pages = "10--20",
  number = "7",
  publisher = "Science Press"
}`;

  const entries = parseBibEntries(content, "C:/tmp/library.bib");

  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0], {
    key: "smith2024",
    type: "article",
    title: "Forecast Skill",
    authors: "Smith, John and Doe, Jane",
    editors: "",
    year: "2024",
    journal: "Weather Journal",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "10.1000/example",
    publisher: "",
    institution: "",
    sourcePath: "C:/tmp/library.bib",
    searchText: "smith2024 forecast skill smith, john and doe, jane 2024 weather journal 10.1000/example",
  });
  assert.equal(entries[1].type, "inproceedings");
  assert.equal(entries[1].journal, "HPC Weather");
  assert.equal(entries[1].issue, "7");
  assert.equal(entries[1].publisher, "Science Press");
});
