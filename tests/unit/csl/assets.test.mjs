import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  createFreshModuleUrl,
  createMockPluginForStyle,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

const { styleRoot } = setupTyporaTestEnv();

test("ensureCslTemplate 在缺少配置时抛错", async () => {
  const { ensureCslTemplate } = await import(createFreshModuleUrl("src/csl/assets.js"));
  assert.throws(
    () => ensureCslTemplate({
      settings: { get: () => "" },
      i18n: { t: { cslPathRequired: "missing csl", cslFileNotFound: "missing: " } },
      app: { vault: { path: process.cwd() } },
    }),
    /missing csl/,
  );
});

test("ensureCslTemplate 在文件不存在时抛错", async () => {
  const { ensureCslTemplate } = await import(createFreshModuleUrl("src/csl/assets.js"));
  assert.throws(
    () => ensureCslTemplate(createMockPluginForStyle(path.join(styleRoot, "missing-style.csl"))),
    /missing file:/,
  );
});

test("ensureCslTemplate 会缓存同一模板并在文件更新后生成新名称", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "csl-assets-"));
  const stylePath = path.join(tempDir, "custom-style.csl");
  const original = fs.readFileSync(path.join(styleRoot, "apa.csl"), "utf8");
  fs.writeFileSync(stylePath, original, "utf8");

  const { ensureCslTemplate } = await import(createFreshModuleUrl("src/csl/assets.js"));
  const plugin = createMockPluginForStyle(stylePath);
  const first = ensureCslTemplate(plugin);
  const second = ensureCslTemplate(plugin);
  assert.equal(second, first);

  const stat = fs.statSync(stylePath);
  fs.utimesSync(stylePath, stat.atime, new Date(stat.mtimeMs + 2000));
  const third = ensureCslTemplate(plugin);
  assert.notEqual(third, first);
});
