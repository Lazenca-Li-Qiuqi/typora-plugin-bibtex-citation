# LAST_RUN

## 日期

- 2026-03-17

## 已完成

- 将 `tests/` 正式纳入版本控制，整理为 `tests/unit/`、`tests/support/`、`tests/fixtures/` 三层结构，并保留 `tests/output/` 作为本地产物目录
- 删除原有 smoke 脚本入口，把真实 CSL 样式回归迁入正式单元测试，当前统一通过 `npm test` 执行
- 为 BibTeX 数据层补齐单元测试：覆盖设置序列化、路径解析、BibTeX 解析与 `BibEntryStore` 的合并 / 缓存行为
- 为 CSL 主链路补齐单元测试：覆盖样式模板注册、严格 citation block 解析、受控 citation 真源、citation 渲染 / 恢复与 bibliography 更新
- 为当前文档状态、建议器、设置页、插件薄封装、侧边栏动作分支与共享工具补齐单元测试
- 当前仓库已具备 79 条 Node 单元测试，`npm test` 全绿

## 主要方法与工具

- `Get-Content AGENTS.md`
- `Get-Content README.md`
- `Get-Content src\\bibtex\\*.js`
- `Get-Content src\\csl\\*.js`
- `Get-Content src\\document\\state.js`
- `Get-Content src\\suggest\\*.js`
- `Get-Content src\\sidebar\\panel.js`
- `npm test`
- `apply_patch`

## 当前任务

- 版本 `0.3.3` 的主要工作继续聚焦到测试体系建设，当前核心数据层与 CSL 主链路已有较完整的单元测试保护
- 下一步更值得继续的是：继续评估高宿主耦合层是否还需要更细的轻量 DOM 测试，或回到功能侧继续扩 locator / prefix / suffix / note-style

## 下次继续

- 若继续补测试，优先评估 `src/settings/tab.js` 与更细的 `src/suggest/interactions.js` / `src/sidebar/panel.js` DOM 细节是否值得继续增加 mock 覆盖
- 若继续做功能开发，优先评估 locator、prefix/suffix 与 note-style 的支持边界，并同步补对应单元测试
- 若需要发布后核验，可在 Typora 真机里快速抽查：`[@query]` 建议、citation 渲染 / 恢复、bibliography 更新以及当前文档统计是否仍与单测结论一致
