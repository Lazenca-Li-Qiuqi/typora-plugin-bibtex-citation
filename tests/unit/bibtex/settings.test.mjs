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

test("parseBibFileList 解析 JSON 文件配置列表并过滤无效项", () => {
  assert.deepEqual(
    parseBibFileList(
      JSON.stringify([
        { path: "./a.bib", sourceType: "markdown-relative" },
        { path: " ", sourceType: "absolute" },
        { path: "C:/b.bib", sourceType: "absolute" },
      ]),
    ),
    [
      { path: "./a.bib", sourceType: "markdown-relative" },
      { path: "C:/b.bib", sourceType: "absolute" },
    ],
  );
});

test("serializeBibFileList 会清理无效项并按 JSON 序列化", () => {
  assert.equal(
    serializeBibFileList([
      { path: " ./a.bib ", sourceType: "markdown-relative" },
      { path: "", sourceType: "absolute" },
      null,
      { path: "C:/b.bib", sourceType: "absolute" },
    ]),
    JSON.stringify([
      { path: "./a.bib", sourceType: "markdown-relative" },
      { path: "C:/b.bib", sourceType: "absolute" },
    ]),
  );
});
