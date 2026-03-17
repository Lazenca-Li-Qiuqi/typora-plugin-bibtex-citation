import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { PATH_BASE_MODE } = await import(createFreshModuleUrl("src/constants.js"));
const {
  getActiveMarkdownPath,
  getTyporaBasePath,
  resolveBibFilePath,
  resolveCslFilePath,
  shouldRejectRelativePath,
} = await import(createFreshModuleUrl("src/bibtex/path-resolver.js"));

function createPlugin(pathBase, vaultPath = "C:/vault") {
  return {
    settings: {
      get(key) {
        if (key === "pathBase") {
          return pathBase;
        }
        return "";
      },
    },
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

test("shouldRejectRelativePath 仅在 absolute 模式下拒绝相对路径", () => {
  assert.equal(shouldRejectRelativePath(createPlugin(PATH_BASE_MODE.ABSOLUTE), "./a.bib"), true);
  assert.equal(shouldRejectRelativePath(createPlugin(PATH_BASE_MODE.ABSOLUTE), "C:/a.bib"), false);
  assert.equal(shouldRejectRelativePath(createPlugin(PATH_BASE_MODE.MARKDOWN), "./a.bib"), false);
});

test("resolveBibFilePath 在 markdown 模式下相对当前文档解析", () => {
  globalThis.document.querySelector = () => null;
  globalThis.document.title = "C:/notes/paper/ch1.md";
  const resolved = resolveBibFilePath("../refs/library.bib", createPlugin(PATH_BASE_MODE.MARKDOWN));
  assert.equal(resolved, path.resolve("C:/notes/paper", "../refs/library.bib"));
});

test("resolveCslFilePath 在 typora 模式下相对 vault 解析", () => {
  globalThis.document.querySelector = () => null;
  globalThis.document.title = "";
  const resolved = resolveCslFilePath("./styles/apa.csl", createPlugin(PATH_BASE_MODE.TYPORA, "D:/workspace"));
  assert.equal(resolved, path.resolve("D:/workspace", "./styles/apa.csl"));
});

test("resolveBibFilePath 在 absolute 模式下拒绝相对路径", () => {
  assert.equal(resolveBibFilePath("./refs/library.bib", createPlugin(PATH_BASE_MODE.ABSOLUTE)), "");
});

test("getTyporaBasePath 优先返回 vault 路径", () => {
  assert.equal(getTyporaBasePath(createPlugin(PATH_BASE_MODE.TYPORA, "E:/vault")), "E:/vault");
});
