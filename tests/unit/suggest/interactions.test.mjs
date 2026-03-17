import test from "node:test";
import assert from "node:assert/strict";

import {
  createFreshModuleUrl,
  setupTyporaTestEnv,
} from "../../support/typora-test-env.mjs";

setupTyporaTestEnv();

const listeners = new Map();
globalThis.document.addEventListener = (type, handler) => {
  listeners.set(type, handler);
};
globalThis.document.removeEventListener = (type) => {
  listeners.delete(type);
};

globalThis.HTMLElement = class HTMLElement {};
globalThis.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  disconnect() {}
};

const { registerSuggestInteractions } = await import(createFreshModuleUrl("src/suggest/interactions.js"));

function createPlugin() {
  return {
    _suggest: {
      _query: "smi",
      getSuggestions() {
        return [{ key: "smith2024" }];
      },
      lengthOfTextBeforeToBeReplaced() {
        return 4;
      },
    },
    _registers: [],
    register(cleanup) {
      this._registers.push(cleanup);
    },
    registerDomEvent() {},
    scheduleCitationStateRefreshCalls: 0,
    scheduleCitationStateRefresh() {
      this.scheduleCitationStateRefreshCalls += 1;
    },
  };
}

test("registerSuggestInteractions 的 keydown 处理会在 ]/Backspace/Delete 时刷新 citation 状态", () => {
  const plugin = createPlugin();
  registerSuggestInteractions(plugin);

  plugin._handleCitationStateKeydown({ key: "]", isComposing: false });
  plugin._handleCitationStateKeydown({ key: "Backspace", isComposing: false });
  plugin._handleCitationStateKeydown({ key: "Delete", isComposing: false });
  plugin._handleCitationStateKeydown({ key: "a", isComposing: false });

  assert.equal(plugin.scheduleCitationStateRefreshCalls, 3);
});

test("registerSuggestInteractions 的回车兜底会应用第一条建议", () => {
  const plugin = createPlugin();
  const range = {
    setStartCalls: [],
    setEndCalls: [],
    setStart(node, offset) {
      this.setStartCalls.push([node, offset]);
    },
    setEnd(node, offset) {
      this.setEndCalls.push([node, offset]);
    },
  };
  const anchorTextNode = {};
  let pasted = "";
  let hidden = false;

  globalThis.window.editor = {
    autoComplete: {
      state: {
        anchor: {
          containerNode: { firstChild: anchorTextNode },
          start: 5,
          end: 9,
        },
      },
      hide() {
        hidden = true;
      },
    },
    selection: {
      getRangy() {
        return range;
      },
      setRange() {},
    },
    UserOp: {
      pasteHandler(_, text) {
        pasted = text;
      },
    },
  };

  class MockContainer extends HTMLElement {
    querySelector(selector) {
      if (selector.includes("aria-selected")) {
        return null;
      }
      if (selector === ".bibtex-cite-item[data-bibtex-key]") {
        return {
          getAttribute() {
            return "smith2024";
          },
        };
      }
      return null;
    }
    getBoundingClientRect() {
      return { height: 100, left: 20, right: 400 };
    }
  }

  globalThis.document.querySelectorAll = () => [new MockContainer()];

  registerSuggestInteractions(plugin);

  let prevented = false;
  plugin._handleSuggestEnterKey({
    key: "Enter",
    isComposing: false,
    preventDefault() { prevented = true; },
    stopPropagation() {},
    stopImmediatePropagation() {},
  });

  assert.equal(prevented, true);
  assert.equal(pasted, "@smith2024");
  assert.equal(hidden, true);
  assert.deepEqual(range.setStartCalls.length, 1);
  assert.deepEqual(range.setEndCalls.length, 1);
});

test("registerSuggestInteractions 的 pointer 兜底会应用点击项，并在 click 后清空抑制状态", () => {
  const plugin = createPlugin();
  let pasted = "";
  globalThis.window.editor = {
    autoComplete: {
      state: {
        anchor: {
          containerNode: { firstChild: {} },
          start: 5,
          end: 9,
        },
      },
      hide() {},
    },
    selection: {
      getRangy() {
        return {
          setStart() {},
          setEnd() {},
        };
      },
      setRange() {},
    },
    UserOp: {
      pasteHandler(_, text) {
        pasted = text;
      },
    },
  };

  registerSuggestInteractions(plugin);

  const itemEl = {
    getAttribute() {
      return "smith2024";
    },
    closest(selector) {
      return selector === ".auto-suggest-container" ? {} : null;
    },
  };
  const target = {
    closest(selector) {
      return selector === ".bibtex-cite-item[data-bibtex-key]" ? itemEl : null;
    },
  };

  plugin._handleSuggestPointerDown({
    target,
    preventDefault() {},
    stopPropagation() {},
    stopImmediatePropagation() {},
  });
  assert.equal(pasted, "@smith2024");
  assert.equal(plugin._suppressPointerEventsUntil > Date.now(), true);

  plugin._handleSuggestPointerFinish({
    type: "click",
    preventDefault() {},
    stopPropagation() {},
    stopImmediatePropagation() {},
  });
  assert.equal(plugin._suppressPointerEventsUntil, 0);
});

test("registerSuggestInteractions 的 schedule clamp 会修正越界建议框位置", () => {
  const plugin = createPlugin();
  const container = new HTMLElement();
  container.style = {};
  container.getBoundingClientRect = () => ({ left: 900, right: 1400, height: 100 });

  globalThis.document.querySelectorAll = (selector) => (
    selector === ".auto-suggest-container" ? [container] : []
  );

  registerSuggestInteractions(plugin);
  plugin._scheduleSuggestClamp();

  assert.equal(container.style.maxWidth, "672px");
  assert.match(container.style.transform, /translateX\(-132px\)/);
});
