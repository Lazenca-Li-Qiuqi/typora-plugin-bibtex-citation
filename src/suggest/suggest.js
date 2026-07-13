const { EditorSuggest } = window[Symbol.for("typora-plugin-core@v2")];

import { MAX_SUGGESTIONS } from "../constants.js";
import { findNarrativeCitationQuery } from "../csl/narrative-citations.js";
import { renderBibSuggestion } from "./render.js";

/**
 * 功能：在 Typora 编辑器中提供 BibTeX 引用建议。
 * 输入：构造时接收 app 与插件实例。
 * 输出：供宿主注册的 EditorSuggest 子类实例。
 */
export class BibCitationSuggest extends EditorSuggest {
  constructor(app, plugin) {
    super();
    this.app = app;
    this.plugin = plugin;
    this.triggerText = "@";
  }

  findQuery(text) {
    const lastOpenBracket = text.lastIndexOf("[");
    const lastCloseBracket = text.lastIndexOf("]");
    if (lastOpenBracket > lastCloseBracket) {
      const bracketContent = text.slice(lastOpenBracket + 1);
      const match = bracketContent.match(/(?:^|;\s*)@([^@\]\s;]*)$/);
      return { isMatched: !!match, query: match ? match[1] : "" };
    }

    const narrativeQuery = findNarrativeCitationQuery(text);
    return {
      isMatched: narrativeQuery !== null,
      query: narrativeQuery || "",
    };
  }

  getSuggestions(query) {
    if (!query) return [];

    const normalizedQuery = query.toLowerCase();
    const entries = this.plugin.getBibEntries();
    if (entries.some((item) => item.key.toLowerCase() === normalizedQuery)) {
      return [];
    }

    return entries
      .filter((item) => item.searchText.includes(normalizedQuery))
      .sort((a, b) => {
        const aStarts = a.key.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
        const bStarts = b.key.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.key.localeCompare(b.key);
      })
      .slice(0, MAX_SUGGESTIONS);
  }

  getSuggestionId(item) {
    return item.key;
  }

  renderSuggestion(item) {
    return renderBibSuggestion(item);
  }

  beforeApply(item) {
    return `@${item.key}`;
  }
}
