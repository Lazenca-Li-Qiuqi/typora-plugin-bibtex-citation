import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { PATH_BASE_MODE } = await import(createFreshModuleUrl("src/constants.js"));
const { BibEntryStore } = await import(createFreshModuleUrl("src/bibtex/store.js"));

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function createPlugin(bibFiles) {
  return {
    settings: {
      get(key) {
        if (key === "bibFiles") {
          return bibFiles.join("\n");
        }
        if (key === "pathBase") {
          return PATH_BASE_MODE.ABSOLUTE;
        }
        return "";
      },
    },
    i18n: {
      t: {
        absolutePathRequired: "absolute required",
        fileNotFound: "missing: ",
        loadError: "load error: ",
      },
    },
    app: {
      vault: {
        path: process.cwd(),
      },
    },
  };
}

test("BibEntryStore 合并多个 bib 文件并以前面的重复 key 为准", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bib-store-"));
  const primary = path.join(tempDir, "primary.bib");
  const secondary = path.join(tempDir, "secondary.bib");
  writeFile(primary, `@article{dupkey, title={Primary}, author={Smith, John}, year={2024}}`);
  writeFile(secondary, `@article{dupkey, title={Secondary}, author={Doe, Jane}, year={2023}}
@article{uniquekey, title={Unique}, author={Wang, Lei}, year={2022}}`);

  const store = new BibEntryStore(createPlugin([primary, secondary]));
  const entries = store.getEntries();

  assert.equal(entries.length, 2);
  assert.equal(entries[0].title, "Primary");
  assert.equal(entries[1].key, "uniquekey");
  assert.deepEqual([...store.getEntryKeySet()].sort(), ["dupkey", "uniquekey"]);
});

test("BibEntryStore 会复用 mergedEntries 缓存并可通过 clear 重置", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bib-store-"));
  const bib = path.join(tempDir, "library.bib");
  writeFile(bib, `@article{alpha, title={Alpha}, author={Smith, John}, year={2024}}`);

  const store = new BibEntryStore(createPlugin([bib]));
  const first = store.getEntries();
  const second = store.getEntries();
  assert.strictEqual(second, first);

  store.clear();
  const third = store.getEntries();
  assert.notStrictEqual(third, first);
  assert.equal(third[0].key, "alpha");
});
