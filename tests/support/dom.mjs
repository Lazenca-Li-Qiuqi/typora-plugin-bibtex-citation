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

/**
 * 功能：构造单元测试使用的最小 DOM 元素 mock。
 * 输入：HTML 标签名。
 * 输出：带常用 DOM 字段与事件接口的 mock 元素。
 */
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

/**
 * 功能：收集 mock DOM 树中的可见文本。
 * 输入：mock DOM 节点。
 * 输出：按树结构拼接后的文本内容。
 */
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
