import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const {
  extractYamlFrontmatter,
  parseMarkdownFrontmatterFileConfigs,
} = await import(createFreshModuleUrl("src/document/frontmatter.js"));

test("extractYamlFrontmatter 只读取 Markdown 开头的 YAML 块", () => {
  const markdown = `---
bib: ./refs.bib
---

正文`;

  assert.equal(extractYamlFrontmatter(markdown), "bib: ./refs.bib");
  assert.equal(extractYamlFrontmatter("正文\n---\nbib: ./refs.bib\n---"), "");
});

test("parseMarkdownFrontmatterFileConfigs 支持字符串形式的 bib 与 csl", () => {
  const configs = parseMarkdownFrontmatterFileConfigs(`---
bib: ./refs.bib
csl: ./apa.csl
---

正文`);

  assert.deepEqual(configs.bibFiles, [
    { path: "./refs.bib", sourceType: "markdown-relative" },
  ]);
  assert.deepEqual(configs.cslFile, {
    path: "./apa.csl",
    sourceType: "markdown-relative",
  });
});

test("parseMarkdownFrontmatterFileConfigs 支持 bib 列表与单个 csl 字符串", () => {
  const configs = parseMarkdownFrontmatterFileConfigs(`---
bib:
  - ./primary.bib
  - ./secondary.bib
csl: ./styles/apa.csl
---

正文`);

  assert.deepEqual(configs.bibFiles, [
    { path: "./primary.bib", sourceType: "markdown-relative" },
    { path: "./secondary.bib", sourceType: "markdown-relative" },
  ]);
  assert.deepEqual(configs.cslFile, {
    path: "./styles/apa.csl",
    sourceType: "markdown-relative",
  });
});

test("parseMarkdownFrontmatterFileConfigs 支持行内数组形式的 bib", () => {
  const configs = parseMarkdownFrontmatterFileConfigs(`---
bib: [./a.bib, "./b.bib"]
---

正文`);

  assert.deepEqual(configs.bibFiles, [
    { path: "./a.bib", sourceType: "markdown-relative" },
    { path: "./b.bib", sourceType: "markdown-relative" },
  ]);
});

test("parseMarkdownFrontmatterFileConfigs 忽略 bib 和 csl 之外的别名与对象写法", () => {
  const configs = parseMarkdownFrontmatterFileConfigs(`---
bibliography: ./ignored.bib
bibtex: ./ignored-too.bib
cslFile: ./ignored.csl
bib:
  path: ./object-is-ignored.bib
csl:
  path: ./object-is-ignored.csl
---

正文`);

  assert.deepEqual(configs, { bibFiles: [], cslFile: null });
});
