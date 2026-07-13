import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const {
  collectValidNarrativeCitationsFromMarkdown,
  findNarrativeCitationQuery,
  parsePandocNarrativeCitationAt,
  parseStrictNarrativeCitationKey,
} = await import(createFreshModuleUrl("src/csl/narrative-citations.js"));

test("parsePandocNarrativeCitationAt 遵循 Pandoc key 与内部标点规则", () => {
  const dotted = parsePandocNarrativeCitationAt("@Foo_bar.baz.", 0);
  const repeated = parsePandocNarrativeCitationAt("@Foo_bar--baz", 0);
  const braced = parsePandocNarrativeCitationAt("@{Foo_bar.baz.}", 0);

  assert.deepEqual(
    { key: dotted.key, text: dotted.text },
    { key: "Foo_bar.baz", text: "@Foo_bar.baz" },
  );
  assert.deepEqual(
    { key: repeated.key, text: repeated.text },
    { key: "Foo_bar", text: "@Foo_bar" },
  );
  assert.deepEqual(
    { key: braced.key, text: braced.text },
    { key: "Foo_bar.baz.", text: "@{Foo_bar.baz.}" },
  );
});

test("parseStrictNarrativeCitationKey 只接受完整叙述式 token", () => {
  assert.equal(parseStrictNarrativeCitationKey("@smith2024"), "smith2024");
  assert.equal(parseStrictNarrativeCitationKey("@{smith--2024}"), "smith--2024");
  assert.equal(parseStrictNarrativeCitationKey("@smith2024 says"), null);
  assert.equal(parseStrictNarrativeCitationKey("根据@smith2024"), null);
});

test("collectValidNarrativeCitationsFromMarkdown 仅收集正文中的已知独立 key", () => {
  const markdown = [
    "---",
    "author: @known",
    "---",
    "@known 认为结论成立。",
    "根据@known 的研究。",
    "email@known.example",
    "https://example.org/@known",
    "`@known`",
    "<!-- @known -->",
    "[@known]",
    "[see @known]",
    "@unknown 只是普通账号。",
    "    @known",
    "```text",
    "@known",
    "```",
    "(@known) 再次出现。",
  ].join("\n");
  const citations = collectValidNarrativeCitationsFromMarkdown(
    markdown,
    (key) => key === "known",
  );

  assert.deepEqual(
    citations.map((citation) => citation.range.text),
    ["@known", "@known"],
  );
  assert.ok(citations.every((citation) => citation.citationMode === "narrative"));
});

test("findNarrativeCitationQuery 只在独立正文 token 末尾匹配", () => {
  assert.equal(findNarrativeCitationQuery("@smi"), "smi");
  assert.equal(findNarrativeCitationQuery("根据 @smi"), "smi");
  assert.equal(findNarrativeCitationQuery("根据@smi"), null);
  assert.equal(findNarrativeCitationQuery("mail@smi"), null);
  assert.equal(findNarrativeCitationQuery("https://example/@smi"), null);
  assert.equal(findNarrativeCitationQuery("prefix [@smi"), null);
  assert.equal(findNarrativeCitationQuery("`@smi`"), null);
});
