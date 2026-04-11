import { DISPLAY_LANGUAGE } from "../constants.js";
import {
  parseBibFileList,
  parseSingleFileConfig,
  serializeBibFileList,
  serializeSingleFileConfig,
} from "../bibtex/settings.js";
import { BibCitationSettingTab } from "../settings/tab.js";
import { BibCitationSidebarPanel } from "../sidebar/panel.js";
import { BibCitationSuggest } from "../suggest/suggest.js";
import { registerSuggestInteractions } from "../suggest/interactions.js";

/**
 * 功能：把设置中的关键字段规范化为运行时约定格式。
 * 输入：插件实例。
 * 输出：无返回值。
 */
export function normalizePluginSettings(plugin) {
  plugin.settings.set(
    "bibFiles",
    serializeBibFileList(parseBibFileList(plugin.settings.get("bibFiles"))),
  );
  plugin.settings.set(
    "cslFile",
    serializeSingleFileConfig(parseSingleFileConfig(plugin.settings.get("cslFile"))),
  );
  plugin.settings.set(
    "displayLanguage",
    plugin.settings.get("displayLanguage") || DISPLAY_LANGUAGE.ZH_CN,
  );
}

/**
 * 功能：注册设置页、侧边栏与建议器，完成主控层的运行时装配。
 * 输入：插件实例。
 * 输出：无返回值。
 */
export function registerPluginRuntime(plugin) {
  plugin.registerSettingTab(new BibCitationSettingTab(plugin));
  plugin.sidebarPanel = new BibCitationSidebarPanel(plugin);
  plugin.register(plugin.app.workspace.sidebar.addPanel(plugin.sidebarPanel));

  plugin._suggest = null;
  registerSuggestInteractions(plugin);

  const suggest = new BibCitationSuggest(plugin.app, plugin);
  plugin._suggest = suggest;
  plugin.registerMarkdownSugguest(suggest);
}
