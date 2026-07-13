import { getPluginRequire } from "./runtime.js";

const pluginRequire = getPluginRequire();
const { plugins, util } = pluginRequire("@citation-js/core");
pluginRequire("@citation-js/plugin-csl");

/**
 * 功能：使用单个 citeproc 实例批量渲染整篇文档的 citation cluster。
 * 输入：CSL-JSON 条目、按文档顺序排列的 citation cluster、CSL 模板名。
 * 输出：与 citation cluster 一一对应的 HTML citation 字符串数组。
 */
export function renderCitationClusters(cslItems, citationClusters, templateName) {
  if (!citationClusters.length) {
    return [];
  }

  const config = plugins.config.get("@csl");
  const engine = config.engine(
    util.downgradeCsl(cslItems),
    templateName,
    undefined,
    "html",
  );
  const citations = citationClusters.map((cluster, index) => ({
    citationID: `bibtex-citation-${index}`,
    citationItems: cluster.keys.map((id) => ({ id })),
    properties: {
      noteIndex: 0,
      ...(cluster.citationMode === "narrative" ? { mode: "composite" } : {}),
    },
  }));

  return engine
    .rebuildProcessorState(citations, "html", [])
    .map((citation) => citation[2]);
}
