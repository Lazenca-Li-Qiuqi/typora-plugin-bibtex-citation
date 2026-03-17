import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { escapeHtml, normalizeWhitespace, summarizeText } = await import(
  createFreshModuleUrl("src/utils/html.js")
);

test("normalizeWhitespace 会压缩空白并裁剪首尾", () => {
  assert.equal(normalizeWhitespace("  a \n\t b   c  "), "a b c");
});

test("summarizeText 会在超长时追加省略号", () => {
  assert.equal(summarizeText("abcdef", 5), "ab...");
});

test("escapeHtml 会转义常见 HTML 特殊字符", () => {
  assert.equal(
    escapeHtml(`<a href="x">it's & ok</a>`),
    "&lt;a href=&quot;x&quot;&gt;it&#39;s &amp; ok&lt;/a&gt;",
  );
});
