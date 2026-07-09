# Tests

测试目录按用途分层组织，避免单元测试、测试辅助代码、夹具和本地产物混在一起。

## 目录结构

- `tests/unit/`：受版本控制的单元测试，优先放纯函数与低耦合模块测试
- `tests/support/`：测试辅助代码，如 Typora 运行时 mock、共享 helper
- `tests/fixtures/`：受版本控制的测试夹具与样式文件
- `tests/output/`：临时本地调试输出目录，不纳入 Git

## Harness 分层

- `tests/support/typora-test-env.mjs`：兼容性入口，继续导出现有测试使用的 helper，并负责安装最小 Typora 全局环境
- `tests/support/dom.mjs`：最小 DOM 元素 mock 与文本收集 helper
- `tests/support/paths.mjs`：测试工作区、CSL fixture 与样式目录路径
- `tests/support/csl-plugin.mjs`：用于 CSL 模板注册测试的 mock 插件对象
- `tests/support/module-url.mjs`：动态导入缓存击穿 URL helper

## 当前约定

- `npm test` 只运行 `tests/unit/` 下的正式单元测试
- 新增测试时，优先按被测模块放到 `tests/unit/<domain>/`
