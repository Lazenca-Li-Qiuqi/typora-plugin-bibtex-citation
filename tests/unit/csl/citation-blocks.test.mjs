import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { extractClosedBracketRanges } = await import(createFreshModuleUrl("src/document/brackets.js"));
const {
  collectCitationSourcesFromMarkdown,
  findFirstInvalidCitationProblem,
  parseCitationSourceText,
  parseStrictCitationKeys,
} = await import(createFreshModuleUrl("src/csl/citation-blocks.js"));
const {
  CITATION_END_MARKER,
  CITATION_START_MARKER,
  escapeControlledCitationPayload,
} = await import(createFreshModuleUrl("src/csl/controlled-citations.js"));

test("parseStrictCitationKeys 解析单条严格 citation", () => {
  assert.deepEqual(parseStrictCitationKeys("[@smith2024]"), ["smith2024"]);
});

test("parseStrictCitationKeys 解析多条严格 citation 并忽略分号周围空白", () => {
  assert.deepEqual(
    parseStrictCitationKeys("[@smith2024 ;   @doe2023]"),
    ["smith2024", "doe2023"],
  );
});

test("parseStrictCitationKeys 拒绝空块与缺少 @ 的块", () => {
  assert.equal(parseStrictCitationKeys("[]"), null);
  assert.equal(parseStrictCitationKeys("[smith2024]"), null);
});

test("parseStrictCitationKeys 拒绝 locator、prefix 与复杂 cluster", () => {
  assert.equal(parseStrictCitationKeys("[@smith2024, p. 3]"), null);
  assert.equal(parseStrictCitationKeys("[see @smith2024]"), null);
  assert.equal(parseStrictCitationKeys("[@smith2024; see @doe2023]"), null);
});

test("parseCitationSourceText 区分严格括号式与 Pandoc 叙述式引用", () => {
  assert.deepEqual(parseCitationSourceText("[@smith2024]"), {
    keys: ["smith2024"],
    citationMode: "normal",
  });
  assert.deepEqual(parseCitationSourceText("@smith2024"), {
    keys: ["smith2024"],
    citationMode: "narrative",
  });
  assert.equal(parseCitationSourceText("[see @smith2024]"), null);
});

test("extractClosedBracketRanges 提取单行多个闭合方括号块", () => {
  const ranges = extractClosedBracketRanges("a [@alpha] b [@beta; @gamma]");
  assert.deepEqual(
    ranges.map((range) => range.text),
    ["[@alpha]", "[@beta; @gamma]"],
  );
});

test("extractClosedBracketRanges 不跨行拼接括号", () => {
  const ranges = extractClosedBracketRanges("[@alpha\n@beta]");
  assert.deepEqual(ranges, []);
});

test("extractClosedBracketRanges 忽略 HTML 注释中的 citation", () => {
  const ranges = extractClosedBracketRanges("<!-- [@hidden] -->\nvisible [@shown]");
  assert.deepEqual(
    ranges.map((range) => range.text),
    ["[@shown]"],
  );
});

test("collectCitationSourcesFromMarkdown 同时收集 visible 与 controlled 引用源并按位置排序", () => {
  const controlled = `${CITATION_START_MARKER}${escapeControlledCitationPayload("[@controlled]")} -->(Controlled)${CITATION_END_MARKER}`;
  const markdown = `lead [@visible]\n${controlled}\nend [@tail]`;
  const sources = collectCitationSourcesFromMarkdown(
    markdown,
    (key) => ["visible", "controlled", "tail"].includes(key),
  );

  assert.deepEqual(
    sources.map((source) => ({
      sourceType: source.sourceType,
      text: source.range.text,
      keys: source.keys,
    })),
    [
      { sourceType: "visible", text: "[@visible]", keys: ["visible"] },
      { sourceType: "controlled", text: "[@controlled]", keys: ["controlled"] },
      { sourceType: "visible", text: "[@tail]", keys: ["tail"] },
    ],
  );
});

test("collectCitationSourcesFromMarkdown 合并括号式、叙述式与受控叙述式来源", () => {
  const controlled = `${CITATION_START_MARKER}${escapeControlledCitationPayload("@controlled")} -->Controlled (2024)${CITATION_END_MARKER}`;
  const markdown = `@narrative 认为如此 [@normal]\n${controlled}`;
  const sources = collectCitationSourcesFromMarkdown(
    markdown,
    (key) => ["narrative", "normal", "controlled"].includes(key),
  );

  assert.deepEqual(
    sources.map((source) => ({
      text: source.range.text,
      citationMode: source.citationMode,
      sourceType: source.sourceType,
    })),
    [
      { text: "@narrative", citationMode: "narrative", sourceType: "visible" },
      { text: "[@normal]", citationMode: "normal", sourceType: "visible" },
      { text: "@controlled", citationMode: "narrative", sourceType: "controlled" },
    ],
  );
});

test("findFirstInvalidCitationProblem 优先返回正文里的未知 key", () => {
  const problem = findFirstInvalidCitationProblem(
    "ok [@known]\nboom [@unknown]",
    (key) => key === "known",
  );

  assert.deepEqual(problem, {
    type: "unknown-key",
    key: "unknown",
    blockText: "[@unknown]",
  });
});

test("findFirstInvalidCitationProblem 返回正文里的非法 citation block", () => {
  const problem = findFirstInvalidCitationProblem(
    "text [@known, p. 3]",
    (key) => key === "known",
  );

  assert.deepEqual(problem, {
    type: "invalid-block",
    blockText: "[@known, p. 3]",
  });
});

test("findFirstInvalidCitationProblem 也会检查受控 citation 块中的原始内容", () => {
  const controlled = `${CITATION_START_MARKER}${escapeControlledCitationPayload("[see @hidden]")} -->(Hidden)${CITATION_END_MARKER}`;
  const problem = findFirstInvalidCitationProblem(controlled, () => true);

  assert.deepEqual(problem, {
    type: "invalid-block",
    blockText: "[see @hidden]",
  });
});
