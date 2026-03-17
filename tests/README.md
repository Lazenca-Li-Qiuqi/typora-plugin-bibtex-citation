# Tests

测试目录按用途分层组织，避免单元测试、测试辅助代码、夹具和本地产物混在一起。

## 目录结构

- `tests/unit/`：受版本控制的单元测试，优先放纯函数与低耦合模块测试
- `tests/support/`：测试辅助代码，如 Typora 运行时 mock、共享 helper
- `tests/fixtures/`：受版本控制的测试夹具与样式文件
- `tests/output/`：临时本地调试输出目录，不纳入 Git

## 当前约定

- `npm test` 只运行 `tests/unit/` 下的正式单元测试
- 新增测试时，优先按被测模块放到 `tests/unit/<domain>/`
