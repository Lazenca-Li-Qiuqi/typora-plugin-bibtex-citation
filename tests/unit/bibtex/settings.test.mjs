import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { parseBibFileList, serializeBibFileList } = await import(
  createFreshModuleUrl("src/bibtex/settings.js")
);

test("parseBibFileList 支持逗号、分号与换行混合分隔", () => {
  assert.deepEqual(
    parseBibFileList("a.bib, b.bib;\n c.bib\r\nd.bib"),
    ["a.bib", "b.bib", "c.bib", "d.bib"],
  );
});

test("serializeBibFileList 会清理空项并按换行序列化", () => {
  assert.equal(
    serializeBibFileList([" a.bib ", "", "b.bib", null]),
    "a.bib\nb.bib",
  );
});
