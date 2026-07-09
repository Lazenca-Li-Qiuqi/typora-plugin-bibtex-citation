import { createRequire } from "node:module";

import { createMockElement } from "./dom.mjs";
import { fixtureRoot, styleRoot, workspaceDir } from "./paths.mjs";

export { createMockPluginForStyle } from "./csl-plugin.mjs";
export { collectTextContent, createMockElement } from "./dom.mjs";
export { createFreshModuleUrl } from "./module-url.mjs";
export { fixtureRoot, styleRoot, workspaceDir } from "./paths.mjs";

const require = createRequire(import.meta.url);

/**
 * 功能：为 Node 单元测试提供最小 Typora 运行时环境。
 * 输入：无。
 * 输出：返回测试工作区与 CSL fixture 路径信息。
 */
export function setupTyporaTestEnv() {
  globalThis.window = {
    reqnode: require,
    _options: { appPath: workspaceDir },
    requestAnimationFrame(callback) {
      callback();
    },
    innerWidth: 1280,
  };

  globalThis.HTMLElement = class HTMLElement {};
  globalThis.MutationObserver = class MutationObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    disconnect() {}
  };

  globalThis.document = {
    title: "",
    body: createMockElement("body"),
    documentElement: {
      clientWidth: 1280,
    },
    createElement(tagName) {
      return createMockElement(tagName);
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
  };

  return {
    workspaceDir,
    fixtureRoot,
    styleRoot,
  };
}
