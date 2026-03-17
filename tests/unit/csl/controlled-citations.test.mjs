import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const {
  CITATION_END_MARKER,
  CITATION_START_MARKER,
  createControlledCitationPattern,
  escapeControlledCitationPayload,
  unescapeControlledCitationPayload,
} = await import(createFreshModuleUrl("src/csl/controlled-citations.js"));

test("escapeControlledCitationPayload 会转义注释闭合符", () => {
  assert.equal(
    escapeControlledCitationPayload("[@alpha-->beta]"),
    "[@alpha--&gt;beta]",
  );
});

test("unescapeControlledCitationPayload 会恢复原始 citation payload", () => {
  assert.equal(
    unescapeControlledCitationPayload("[@alpha--&gt;beta]"),
    "[@alpha-->beta]",
  );
});

test("createControlledCitationPattern 能匹配受控 citation 块", () => {
  const source = `${CITATION_START_MARKER}${escapeControlledCitationPayload("[@smith2024]")} -->(Smith, 2024)${CITATION_END_MARKER}`;
  const match = createControlledCitationPattern().exec(source);

  assert.ok(match);
  assert.equal(match[1], "[@smith2024]");
  assert.equal(match[2], "(Smith, 2024)");
});
