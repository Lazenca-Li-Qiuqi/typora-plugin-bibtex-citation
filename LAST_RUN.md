# LAST_RUN

## 日期

- 2026-03-17

## 已完成

- 使用 `revise-agents-md` 流程更新项目记忆，把主控层最新拆分结构同步进 `AGENTS.md`
- 将 `src/plugin.js` 当前 façade 化后的职责边界写入项目记忆，明确 `document-actions / runtime / library-runtime / document-state-runtime` 四个子模块的分工
- 记录主控层继续重构时的一个关键约束：子模块优先通过 plugin 公共方法回调，避免破坏现有测试里对可覆写方法的替换能力
- 当前代码状态已验证通过 `npm test`，仍为 86 条单元测试全绿

## 主要方法与工具

- `Get-Content AGENTS.md`
- `Get-Content LAST_RUN.md`
- `Get-Content src\\plugin.js`
- `Get-ChildItem src\\plugin`
- `npm test`
- `apply_patch`

## 当前任务

- 当前项目已完成 README/规则文档收敛与主控层 façade 化拆分，下一步更适合回到功能侧推进 CSL 语法扩展
- 当前最值得推进的功能方向仍是 locator、prefix/suffix、更复杂 citation cluster 与 note-style 边界评估

## 下次继续

- 若开始新功能，优先先更新 `docs/behavior-rules.md`，再补对应单元测试，最后改实现
- 若继续补测试，优先围绕 `src/plugin/runtime.js` 的更细启动注册边界与宿主 DOM 结构断言
- 若准备发版前回归，重点抽查 Typora 真机中的 `[@query]` 建议、citation 渲染/恢复、bibliography 更新与侧边栏刷新
