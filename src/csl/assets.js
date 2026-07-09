import { resolveCslFilePath } from "../bibtex/path-resolver.js";
import { getActiveCslFileConfig } from "../bibtex/source-configs.js";
import { getPluginRequire } from "./runtime.js";

const fs = window.reqnode("fs");
const path = window.reqnode("path");
const pluginRequire = getPluginRequire();
const { plugins } = pluginRequire("@citation-js/core");
pluginRequire("@citation-js/plugin-csl");

let customTemplateCacheKey = "";
let customTemplateName = "";

/**
 * 功能：确保用户配置的 CSL 模板已注册到 Citation.js。
 * 输入：插件实例。
 * 输出：返回可直接用于 Citation.js 的模板名。
 */
export function ensureCslTemplate(plugin) {
  const config = plugins.config.get("@csl");
  return ensureConfiguredTemplate(plugin, config);
}

function ensureConfiguredTemplate(plugin, config) {
  const configuredPath = resolveCslFilePath(getActiveCslFileConfig(plugin), plugin);
  if (!configuredPath) {
    throw new Error(plugin.i18n.t.cslPathRequired);
  }

  if (!fs.existsSync(configuredPath)) {
    throw new Error(`${plugin.i18n.t.cslFileNotFound}${configuredPath}`);
  }

  const stat = fs.statSync(configuredPath);
  const templateCacheKey = `${configuredPath}:${stat.mtimeMs}`;
  if (customTemplateCacheKey === templateCacheKey) {
    return customTemplateName;
  }

  customTemplateName = `bibtex-citation-custom-${path
    .basename(configuredPath, path.extname(configuredPath))
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()}-${Math.round(stat.mtimeMs)}`;
  config.templates.add(customTemplateName, fs.readFileSync(configuredPath, "utf8"));
  customTemplateCacheKey = templateCacheKey;
  return customTemplateName;
}
