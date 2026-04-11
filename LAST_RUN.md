# LAST_RUN

## 日期

- 2026-04-11

## 已完成

- 完成 `v0.4.1` patch 发布整理，基于 `v0.4.0` 以来的文件来源配置重构更新版本与发布说明
- 将 BibTeX 与 CSL 路径配置统一改为逐条 `path + sourceType` 结构，并移除全局 `Path Base` 与跨类别兜底语义
- 将设置页改为折叠式配置区，并统一来源类别下拉样式；侧边栏路径摘要同步切换为 `path (sourceType)` 展示
- 同步 `AGENTS.md`、`README.md`、`docs/behavior-rules.md` 与 `CHANGELOG.md`，使版本状态、规则文档与当前实现保持一致
- 当前代码状态已验证通过 `npm test`，当前为 87 条单元测试全绿

## 主要方法与工具

- `Get-Content AGENTS.md`
- `Get-Content LAST_RUN.md`
- `Get-Content src\\plugin.js`
- `Get-ChildItem src\\plugin`
- `npm test`
- `apply_patch`

## 当前任务

- 当前项目已完成 `path + sourceType` 文件来源模型、折叠式设置页与 `0.4.1` patch 发布
- 下一步更适合回到功能侧推进 CSL 语法扩展，优先评估 locator、prefix/suffix、更复杂 citation cluster 与 note-style 边界

## 下次继续

- 若开始新功能，优先先更新 `docs/behavior-rules.md`，再补对应单元测试，最后改实现
- 若进入 CSL 扩展实现，首批建议围绕 locator、prefix/suffix 与复杂 citation cluster 制定规则和测试清单
- 若准备下次发版前回归，重点抽查 Typora 真机中的设置页折叠区、来源类别选择、`[@query]` 建议、citation 渲染/恢复与 bibliography 更新
