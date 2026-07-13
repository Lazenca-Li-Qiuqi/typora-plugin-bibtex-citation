import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createFreshModuleUrl,
  createMockPluginForStyle,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

const { styleRoot } = setupTyporaTestEnv();

const { ensureCslTemplate } = await import(createFreshModuleUrl("src/csl/assets.js"));
const { renderCitationMarkdown, restoreCitationMarkdown } = await import(
  createFreshModuleUrl("src/csl/render.js")
);
const { toCslItem } = await import(createFreshModuleUrl("src/csl/item.js"));
const { renderCitationClusters } = await import(
  createFreshModuleUrl("src/csl/processor.js")
);
const { getPluginRequire } = await import(createFreshModuleUrl("src/csl/runtime.js"));
const {
  CITATION_START_MARKER,
  escapeControlledCitationPayload,
} = await import(createFreshModuleUrl("src/csl/controlled-citations.js"));

const pluginRequire = getPluginRequire();
const { Cite } = pluginRequire("@citation-js/core");
pluginRequire("@citation-js/plugin-csl");

const styleFiles = fs.readdirSync(styleRoot)
  .filter((fileName) => fileName.endsWith(".csl"))
  .sort();

const entries = [
  {
    key: "doe2020background",
    type: "article",
    title: "Background Theory",
    authors: "Doe, Jane",
    editors: "",
    year: "2020",
    journal: "Theory Journal",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "smith2024a-ocean",
    type: "article",
    title: "Ocean Predictability in a Coupled System",
    authors: "Smith, John",
    editors: "",
    year: "2024",
    journal: "Climate Dynamics",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "smith2024b-land",
    type: "article",
    title: "Land Surface Impacts on Regional Forecasts",
    authors: "Smith, John",
    editors: "",
    year: "2024",
    journal: "Journal of Forecasting",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "smith2023history",
    type: "article",
    title: "Historical Reanalysis Notes",
    authors: "Smith, John",
    editors: "",
    year: "2023",
    journal: "Reanalysis Review",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "smithdoe2024joint1",
    type: "article",
    title: "Joint Assimilation Experiments",
    authors: "Smith, John and Doe, Jane",
    editors: "",
    year: "2024",
    journal: "Data Assimilation Letters",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "smithdoe2024joint2",
    type: "article",
    title: "Joint Verification Experiments",
    authors: "Smith, John and Doe, Jane",
    editors: "",
    year: "2024",
    journal: "Verification Letters",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "smithwang2024joint",
    type: "article",
    title: "Ensemble Perturbation Design",
    authors: "Smith, John and Wang, Lei",
    editors: "",
    year: "2024",
    journal: "Ensemble Science",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "doe2024solo1",
    type: "article",
    title: "Advanced Statistical Postprocessing",
    authors: "Doe, Jane",
    editors: "",
    year: "2024",
    journal: "Applied Analysis",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "doe2024solo2",
    type: "article",
    title: "Probabilistic Calibration Methods",
    authors: "Doe, Jane",
    editors: "",
    year: "2024",
    journal: "Applied Analysis",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "wang2022regional",
    type: "article",
    title: "Regional Forecast Verification",
    authors: "Wang, Lei",
    editors: "",
    year: "2022",
    journal: "Regional Weather",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "brownlee2021hybrid",
    type: "article",
    title: "Hybrid Ensemble Methods",
    authors: "Brown, Alice and Lee, Ming and Taylor, Chris",
    editors: "",
    year: "2021",
    journal: "Hybrid Systems",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
  {
    key: "team2024report",
    type: "article",
    title: "Operational Forecast Report",
    authors: "{ECMWF Research Team}",
    editors: "",
    year: "2024",
    journal: "Forecast Bulletin",
    booktitle: "",
    volume: "",
    issue: "",
    pages: "",
    doi: "",
    publisher: "",
    institution: "",
  },
];

const markdown = `# CSL Super Stress Test

## 1. 单作者同年

[@smith2024a-ocean; @smith2024b-land]

## 2. 单作者跨年

[@smith2023history; @smith2024a-ocean; @smith2024b-land]

## 3. 双作者同年

[@smithdoe2024joint1; @smithdoe2024joint2]

## 4. 同一第一作者，不同作者组合

[@smithdoe2024joint1; @smithwang2024joint]

## 5. 两组作者各自同年

[@smith2024a-ocean; @smith2024b-land; @doe2024solo1; @doe2024solo2]

## 6. 混合交叉

[@smith2024a-ocean; @smith2024b-land; @smithdoe2024joint1; @smithdoe2024joint2; @smithwang2024joint]

## 7. 大型交叉引用簇

[@doe2020background; @brownlee2021hybrid; @wang2022regional; @smith2023history; @smith2024a-ocean; @smith2024b-land; @smithdoe2024joint1]

## 8. 机构作者混合

[@team2024report; @smith2024a-ocean; @brownlee2021hybrid]

## 9. 跨段重复

第一处：[@smith2024a-ocean; @smith2024b-land]

第二处：[@smith2024a-ocean]

第三处：[@smith2024b-land; @smith2023history]

## 10. 同段落多个引用块

这里先引用[@smith2024a-ocean]，后面再引用[@doe2024solo1; @doe2024solo2]，最后补一个机构作者[@team2024report]。

## 11. 非法块应保持原样

[see @smith2024a-ocean]

[@smith2024a-ocean, p. 3]

[@smith2024a-ocean; @unknown2025test]

[@smith2024a-ocean, @smith2024b-land]

[smith2024a-ocean]
`;

test("renderCitationMarkdown 在所有真实 CSL 样式下都能渲染合法 citation 并保留非法块原样", () => {
  for (const styleFile of styleFiles) {
    const templateName = ensureCslTemplate(createMockPluginForStyle(styleFile));
    const renderResult = renderCitationMarkdown(markdown, entries, templateName);

    assert.equal(renderResult.changed, true, `${styleFile} 未触发 citation 渲染`);
    assert.equal(renderResult.renderedBlocks, 14, `${styleFile} 渲染块数量不符合预期`);
    assert.equal(renderResult.renderedKeys, 37, `${styleFile} 渲染 key 数量不符合预期`);
    assert.match(
      renderResult.markdown,
      new RegExp(escapeRegex(`${CITATION_START_MARKER}${escapeControlledCitationPayload("[@smith2024a-ocean; @smith2024b-land]")} -->`)),
      `${styleFile} 没有生成预期的受控 citation 块`,
    );

    assert.ok(
      renderResult.markdown.includes("[see @smith2024a-ocean]"),
      `${styleFile} 错误改写了带前缀说明的非法块`,
    );
    assert.ok(
      renderResult.markdown.includes("[@smith2024a-ocean, p. 3]"),
      `${styleFile} 错误改写了 locator 非法块`,
    );
    assert.ok(
      renderResult.markdown.includes("[@smith2024a-ocean; @unknown2025test]"),
      `${styleFile} 错误改写了包含未知 key 的非法块`,
    );
    assert.ok(
      renderResult.markdown.includes("[@smith2024a-ocean, @smith2024b-land]"),
      `${styleFile} 错误改写了逗号分隔的非法块`,
    );
    assert.ok(
      renderResult.markdown.includes("[smith2024a-ocean]"),
      `${styleFile} 错误改写了缺少 @ 的非法块`,
    );
  }
});

test("renderCitationMarkdown 在所有真实 CSL 样式下都能产出非空 bibliography", () => {
  for (const styleFile of styleFiles) {
    const templateName = ensureCslTemplate(createMockPluginForStyle(styleFile));
    const bibliography = new Cite(entries.map((entry) => toCslItem(entry))).format("bibliography", {
      template: templateName,
      format: "text",
    });

    assert.ok(String(bibliography).trim().length > 0, `${styleFile} bibliography 输出为空`);
  }
});

test("renderCitationMarkdown 使用 CSL composite 模式渲染并恢复叙述式引用", () => {
  const templateName = ensureCslTemplate(createMockPluginForStyle("apa.csl"));
  const narrativeEntry = entries.find((entry) => entry.key === "doe2020background");
  const source = "@doe2020background 认为背景理论仍然适用。";
  const renderResult = renderCitationMarkdown(source, [narrativeEntry], templateName);

  assert.equal(renderResult.renderedBlocks, 1);
  assert.equal(renderResult.renderedKeys, 1);
  assert.match(
    renderResult.markdown,
    /<!-- bibtex-citation:citation:start @doe2020background -->Doe \(2020\)<!-- bibtex-citation:citation:end -->/,
  );

  const restoreResult = restoreCitationMarkdown(renderResult.markdown);
  assert.equal(restoreResult.markdown, source);
  assert.equal(restoreResult.renderedBlocks, 1);
  assert.equal(restoreResult.renderedKeys, 1);
});

test("renderCitationMarkdown 每次批量渲染只创建一次 citation processor", () => {
  const config = pluginRequire("@citation-js/core").plugins.config.get("@csl");
  const originalEngine = config.engine;
  let engineCalls = 0;

  config.engine = (...args) => {
    engineCalls += 1;
    return originalEngine(...args);
  };

  try {
    const templateName = ensureCslTemplate(createMockPluginForStyle("apa.csl"));
    const renderResult = renderCitationMarkdown(markdown, entries, templateName);

    assert.equal(renderResult.renderedBlocks, 14);
    assert.equal(engineCalls, 1);
  } finally {
    config.engine = originalEngine;
  }
});

test("renderCitationClusters 与逐块 Citation.js 上下文渲染结果一致", () => {
  const templateName = ensureCslTemplate(createMockPluginForStyle("apa.csl"));
  const citationItems = entries.slice(0, 4).map((entry) => toCslItem(entry));
  const citationKeyClusters = [
    ["smith2024a-ocean", "smith2024b-land"],
    ["doe2020background"],
    ["smith2023history", "smith2024a-ocean"],
  ];
  const citationClusters = citationKeyClusters.map((keys) => ({
    keys,
    citationMode: "normal",
  }));
  const cite = new Cite(citationItems);
  const expected = citationKeyClusters.map((keys, index) => cite.format("citation", {
    template: templateName,
    format: "html",
    entry: keys,
    citationsPre: citationKeyClusters.slice(0, index),
    citationsPost: citationKeyClusters.slice(index + 1),
  }));

  assert.deepEqual(
    renderCitationClusters(citationItems, citationClusters, templateName),
    expected,
  );
});

test("restoreCitationMarkdown 能恢复由真实 CSL 样式生成的受控 citation 块", () => {
  for (const styleFile of styleFiles) {
    const templateName = ensureCslTemplate(createMockPluginForStyle(styleFile));
    const renderResult = renderCitationMarkdown(markdown, entries, templateName);
    const restoreResult = restoreCitationMarkdown(renderResult.markdown);

    assert.equal(restoreResult.changed, true, `${styleFile} 未触发 citation 恢复`);
    assert.equal(restoreResult.renderedBlocks, 14, `${styleFile} 恢复块数量不符合预期`);
    assert.equal(restoreResult.renderedKeys, 37, `${styleFile} 恢复 key 数量不符合预期`);
    assert.ok(
      restoreResult.markdown.includes("[@smith2024a-ocean; @smith2024b-land]"),
      `${styleFile} 没有恢复合法 citation block`,
    );
    assert.doesNotMatch(
      restoreResult.markdown,
      /<!-- bibtex-citation:citation:start /,
      `${styleFile} 恢复后仍残留受控 citation 注释`,
    );
  }
});

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
