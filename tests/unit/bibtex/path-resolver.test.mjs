import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { FILE_SOURCE_TYPE } = await import(createFreshModuleUrl("src/constants.js"));
const {
  getActiveMarkdownPath,
  getTyporaBasePath,
  isFileConfigShapeValid,
  resolveBibFilePath,
  resolveCslFilePath,
} = await import(createFreshModuleUrl("src/bibtex/path-resolver.js"));

function createPlugin(vaultPath = "C:/vault") {
  return {
    app: {
      vault: {
        path: vaultPath,
      },
    },
  };
}

test("getActiveMarkdownPath 优先读取活动文件节点", () => {
  globalThis.document.querySelector = () => ({
    getAttribute(name) {
      return name === "data-path" ? "C:/notes/ch1.md" : null;
    },
  });
  globalThis.document.title = "ignored.md";
  assert.equal(getActiveMarkdownPath(), "C:/notes/ch1.md");
});

test("getActiveMarkdownPath 在没有活动节点时回退到标题", () => {
  globalThis.document.querySelector = () => null;
  globalThis.document.title = "C:/notes/ch2.md - Typora";
  assert.equal(getActiveMarkdownPath(), "C:/notes/ch2.md");
});

test("isFileConfigShapeValid 仅在 absolute 类别下要求绝对路径", () => {
  assert.equal(
    isFileConfigShapeValid({
      path: "./a.bib",
      sourceType: FILE_SOURCE_TYPE.ABSOLUTE,
    }),
    false,
  );
  assert.equal(
    isFileConfigShapeValid({
      path: "C:/a.bib",
      sourceType: FILE_SOURCE_TYPE.ABSOLUTE,
    }),
    true,
  );
  assert.equal(
    isFileConfigShapeValid({
      path: "./a.bib",
      sourceType: FILE_SOURCE_TYPE.MARKDOWN_RELATIVE,
    }),
    true,
  );
});

test("resolveBibFilePath 在 markdown-relative 类别下相对当前文档解析", () => {
  globalThis.document.querySelector = () => null;
  globalThis.document.title = "C:/notes/paper/ch1.md";
  const resolved = resolveBibFilePath(
    {
      path: "../refs/library.bib",
      sourceType: FILE_SOURCE_TYPE.MARKDOWN_RELATIVE,
    },
    createPlugin(),
  );
  assert.equal(resolved, path.resolve("C:/notes/paper", "../refs/library.bib"));
});

test("resolveCslFilePath 在 typora-relative 类别下相对 vault 解析", () => {
  globalThis.document.querySelector = () => null;
  globalThis.document.title = "";
  const resolved = resolveCslFilePath(
    {
      path: "./styles/apa.csl",
      sourceType: FILE_SOURCE_TYPE.TYPORA_RELATIVE,
    },
    createPlugin("D:/workspace"),
  );
  assert.equal(resolved, path.resolve("D:/workspace", "./styles/apa.csl"));
});

test("resolveBibFilePath 在 absolute 类别下拒绝相对路径", () => {
  assert.equal(
    resolveBibFilePath(
      {
        path: "./refs/library.bib",
        sourceType: FILE_SOURCE_TYPE.ABSOLUTE,
      },
      createPlugin(),
    ),
    "",
  );
});

test("resolveBibFilePath 在 markdown-relative 且缺少当前文档时不再回退", () => {
  globalThis.document.querySelector = () => null;
  globalThis.document.title = "";
  assert.equal(
    resolveBibFilePath(
      {
        path: "./refs/library.bib",
        sourceType: FILE_SOURCE_TYPE.MARKDOWN_RELATIVE,
      },
      createPlugin(),
    ),
    "",
  );
});

test("getTyporaBasePath 优先返回 vault 路径", () => {
  assert.equal(getTyporaBasePath(createPlugin("E:/vault")), "E:/vault");
});
