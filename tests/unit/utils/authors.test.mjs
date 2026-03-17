import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const { formatAuthorDateAuthors } = await import(createFreshModuleUrl("src/utils/authors.js"));

test("formatAuthorDateAuthors 支持单作者、双作者与 et al.", () => {
  assert.equal(formatAuthorDateAuthors("Smith, John"), "Smith");
  assert.equal(formatAuthorDateAuthors("Smith, John and Jane Doe"), "Smith and Doe");
  assert.equal(
    formatAuthorDateAuthors("Smith, John and Jane Doe and {ECMWF Team}"),
    "Smith et al.",
  );
});
