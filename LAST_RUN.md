# LAST_RUN

## 日期

- 2026-03-17

## 已完成

- 完成 `v0.4.0` minor 发布整理，基于 `v0.3.5` 以来的主控层 façade 化重构更新版本与发布说明
- 将 `src/plugin.js` 当前 façade 化后的职责边界写入项目记忆，明确 `document-actions / runtime / library-runtime / document-state-runtime` 四个子模块的分工
- 同步 `AGENTS.md`、`README.md` 与 `CHANGELOG.md`，使版本状态、README 文案和长期维护约束保持一致
- 当前代码状态已验证通过 `npm test`，仍为 86 条单元测试全绿

## 主要方法与工具

- `Get-Content AGENTS.md`
- `Get-Content LAST_RUN.md`
- `Get-Content src\\plugin.js`
- `Get-ChildItem src\\plugin`
- `npm test`
- `apply_patch`

## 当前任务

- 当前项目已完成 README/规则文档收敛、主控层 façade 化拆分与 `0.4.0` minor 发布
- 下一步更适合回到功能侧推进 CSL 语法扩展，优先评估 locator、prefix/suffix、更复杂 citation cluster 与 note-style 边界

## 下次继续

- 若开始新功能，优先先更新 `docs/behavior-rules.md`，再补对应单元测试，最后改实现
- 若进入 CSL 扩展实现，首批建议围绕 locator、prefix/suffix 与复杂 citation cluster 制定规则和测试清单
- 若准备下次发版前回归，重点抽查 Typora 真机中的 `[@query]` 建议、citation 渲染/恢复、bibliography 更新与侧边栏刷新
