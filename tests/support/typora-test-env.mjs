import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const helperDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(helperDir, "..", "..");
const fixtureRoot = path.join(workspaceDir, "tests", "fixtures", "csl");
const styleRoot = path.join(fixtureRoot, "styles");

function createMockClassList(initial = []) {
  const classes = new Set(initial);
  return {
    add(...tokens) {
      tokens.forEach((token) => classes.add(token));
    },
    contains(token) {
      return classes.has(token);
    },
    toString() {
      return [...classes].join(" ");
    },
  };
}

export function createMockElement(tagName = "div") {
  const listeners = new Map();
  const element = {
    tagName: String(tagName).toUpperCase(),
    children: [],
    style: {},
    attributes: new Map(),
    className: "",
    classList: createMockClassList(),
    innerHTML: "",
    textContent: "",
    value: "",
    type: "",
    placeholder: "",
    title: "",
    append(...nodes) {
      this.children.push(...nodes);
    },
    appendChild(node) {
      this.children.push(node);
      return node;
    },
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
    getAttribute(name) {
      return this.attributes.get(name) || null;
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    dispatch(type, event = {}) {
      const handler = listeners.get(type);
      if (handler) {
        handler(event);
      }
    },
    empty() {
      this.children = [];
      this.innerHTML = "";
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    closest() {
      return null;
    },
    getBoundingClientRect() {
      return { left: 0, right: 0, height: 0 };
    },
  };
  return element;
}

export function collectTextContent(node) {
  if (!node) {
    return "";
  }
  const ownText = typeof node.textContent === "string" ? node.textContent : "";
  const childText = Array.isArray(node.children)
    ? node.children.map((child) => collectTextContent(child)).join(" ")
    : "";
  return `${ownText} ${childText}`.trim();
}

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

/**
 * 功能：构造用于注册本地 CSL fixture 的最小 mock 插件对象。
 * 输入：样式文件名或绝对路径。
 * 输出：可供 `ensureCslTemplate()` 使用的插件 mock。
 */
export function createMockPluginForStyle(styleFile = "apa.csl") {
  const cslFilePath = path.isAbsolute(styleFile)
    ? styleFile
    : path.join(styleRoot, styleFile);

  return {
    settings: {
      get(key) {
        if (key === "cslFile") {
          return cslFilePath;
        }
        if (key === "pathBase") {
          return "absolute";
        }
        return "";
      },
    },
    i18n: {
      t: {
        cslPathRequired: "missing csl",
        cslFileNotFound: "missing file: ",
      },
    },
    app: {
      vault: {
        path: workspaceDir,
      },
    },
  };
}

/**
 * 功能：为动态导入的 ESM 模块追加缓存击穿参数，避免跨测试文件共享模块状态。
 * 输入：相对测试 helper 文件的模块路径。
 * 输出：可直接传给 `import()` 的 file URL。
 */
export function createFreshModuleUrl(relativePath) {
  const absolutePath = path.resolve(helperDir, "..", "..", relativePath);
  const url = new URL(pathToFileURL(absolutePath).href);
  url.searchParams.set("t", `${Date.now()}-${Math.random()}`);
  return url.href;
}
