# CHANGELOG

## 0.4.3 - 2026-07-09

- 增加当前 Markdown YAML frontmatter 中的 `bib` 与 `csl` 文档级配置支持；`bib` 会与设置页 `BibTeX Files` 取并集并优先于全局配置，`csl` 会优先于设置页 `CSL File`
- 收紧 frontmatter 规则：只接受 `bib` 与 `csl` 两个字段，路径始终相对当前 Markdown 文件所在目录解析，避免在文档内混入不自然的来源类别配置
- 整理测试 harness 分层，将 DOM mock、路径、CSL mock 与动态导入 helper 拆出独立模块，同时删除已弃用的 `LAST_RUN.md`
- 对齐仓库结构配置：声明 ESM 包类型、将插件平台声明收敛到已验证的 Windows，并简化测试产物忽略规则
- 补齐 frontmatter 解析、BibTeX 缓存合并、CSL 选择与 harness 分层相关单元测试；当前 `npm test` 已覆盖 95 条测试
- 本阶段沉淀的维护约束：文档级配置必须保持最小语义面，运行时统一先生成当前生效文件列表，再进入文件级解析缓存与合并缓存，避免设置页、侧边栏和 CSL 操作各自分叉

## 0.4.2 - 2026-04-11

- 同步 patch 发布状态到 `package.json`、`manifest.json`、`README.md` 与 `AGENTS.md`，将版本号统一更新到 `0.4.2`
- 修正文档中的轻微漂移：README 现已明确逐条 `sourceType` 文件来源配置，并将当前单元测试数量对齐为 87 条

## 0.4.1 - 2026-04-11

- 将 BibTeX 与 CSL 文件配置统一改为逐条 `path + sourceType` 结构，移除全局 `Path Base` 与跨类别兜底解析
- 重构设置页与侧边栏摘要：支持折叠式配置区、统一的来源类别下拉样式，以及 `path (sourceType)` 形式的路径展示
- 同步更新 README、行为规则文档、项目记忆与测试；当前 `npm test` 已覆盖 87 条单元测试

## 0.4.0 - 2026-03-17

- 将 `src/plugin.js` 收敛为主控 façade 层，并把 CSL 文档改写、启动注册、文献库缓存/调度、当前文档状态访问拆分到 `src/plugin/*.js` 子模块，降低主控耦合并保留现有测试可替换性
- 同步 `AGENTS.md`、`LAST_RUN.md` 与 `README.md`，对齐主控层拆分后的项目记忆、对外说明与长期维护约束
- 继续精简 `README.md` 的测试入口与侧边栏操作说明，提升 GitHub 场景下的可扫描性

## 0.3.5 - 2026-03-17

- 新增 `docs/behavior-rules.md`，集中整理当前 BibTeX、建议器、文档扫描、CSL、bibliography、侧边栏与设置页的行为规则与边界
- 精简 `README.md`，将更细的规则说明收敛到行为规则文档，并明确当前仅在 Windows 上完成验证
- 移除侧边栏底部说明文字，改为只保留摘要、按钮、错误和文件列表，同时同步更新相关文案与单元测试

## 0.3.4 - 2026-03-17

- 补齐长期维护导向的最后一轮高收益单元测试，新增 `plugin.onload()` 启动 / 注册链、调度链、`BibEntryStore` 异常分支，以及设置页关键非法输入的覆盖
- 继续完善测试辅助环境，使最小 Typora / DOM mock 能稳定支撑启动链与更多异常路径回归
- 同步 README、AGENTS 与 LAST_RUN 中的测试覆盖状态说明；当前 `npm test` 已包含 86 条单元测试

## 0.3.3 - 2026-03-17

- 继续补齐高宿主耦合层的单元测试，新增设置页行为、侧边栏 `render()` 关键分支，以及建议器 pointer / viewport 兜底逻辑的测试覆盖
- 扩展测试辅助环境，使最小 DOM / Typora mock 能支撑设置页、侧边栏与交互层的轻量回归
- 同步 README、AGENTS 与 LAST_RUN 中的测试覆盖状态说明；当前 `npm test` 已包含 79 条单元测试

## 0.3.2 - 2026-03-17

- 正式将 `tests/` 纳入版本控制，按 `unit / support / fixtures` 分层整理测试目录，并移除原有 smoke 脚本入口，统一收敛到 `npm test`
- 为 CSL 主链路补齐首批正式单元测试：覆盖样式模板注册、严格 citation block 解析、受控 citation 真源、citation 渲染/恢复与 bibliography 更新
- 将单元测试扩展到 BibTeX 数据层、建议器、当前文档状态、插件薄封装与侧边栏动作分支，当前仓库已具备 72 条可回归的 Node 单元测试

## 0.3.1 - 2026-03-12

- 将仓库与包名调整为 `typora-plugin-bibtex-citation`，同时保留 Typora 插件 `id` 与受控 citation 注释前缀 `bibtex-citation`，避免破坏现有文档兼容性
- 更新 README 与 AGENTS 中的项目名称、安装说明和仓库状态说明，使“仓库名已改、插件运行标识暂不改”的现状更加清晰
- 同步 `package.json`、`package-lock.json`、`manifest.json`、`README.md` 与 `AGENTS.md` 的发布版本到 `0.3.1`

## 0.3.0 - 2026-03-12

- 提取共享文本摘要工具，消除 `src/plugin.js` 与 `src/sidebar/panel.js` 中重复的 citation 错误摘要逻辑，降低后续维护时的分叉风险
- 修正文案与元数据一致性：更新 `manifest.json` 中对触发方式的描述，并同步 `README.md` 的平台 badge 以匹配当前支持矩阵
- 对齐发布状态文件：更新 `package.json`、`package-lock.json`、`AGENTS.md` 与 `README.md` 中的版本信息，并把 `AGENTS.md` 中的本地 smoke 命令改写为“仅本地夹具存在时可用”

## 0.2.11 - 2026-03-12

- 重构 `AGENTS.md` 的项目记忆结构，按模块职责、长期约束与分组资源重写内容，清理与项目无关或低价值的零碎历史信息
- 重构 `README.md` 的安装与使用说明：补齐 `Node.js >=22` 前置条件，改为 Windows 场景安装示例，并按侧边栏工作流拆分 citation、bibliography 与限制说明
- 调整 `README.md` 的信息组织方式：顶部改为 GitHub badge 形式的单点版本展示，常见排查按失败模式分组，减少功能概览、使用教学与支持矩阵之间的重复描述

## 0.2.10 - 2026-03-12

- 让 `Render / Update Citations / 渲染/更新引用` 同时处理正文里的严格 `[@key]` 与已有受控 citation 块，切换 `CSL File` 后可以直接原位重渲染，不需要先恢复
- 保持 citation 渲染的整篇文档级上下文与稳定消歧逻辑不变，并在重复执行同一样式时避免无意义改写
- 更新中英文侧边栏文案、README、AGENTS 与 LAST_RUN，使按钮语义和当前“可直接更新已渲染 citation”的行为保持一致

## 0.2.9 - 2026-03-12

- 为 citation 渲染增加受控 citation 块与 `Restore Citations / 恢复`，渲染后保留原始 `[@key]`，可在需要时恢复回原始引用语法
- 抽出统一引用源提取器，同时识别正文里的严格 `[@key]` 与受控 citation 块中的原始 `[@key]`，并让 bibliography、当前文档引用统计与相关校验复用同一套来源模型
- 调整 bibliography 工作流：渲染后的 citation 不再阻断参考文献生成，当前可以直接根据受控 citation 块插入、更新或删除文末受控参考文献块

## 0.2.8 - 2026-03-12

- 收紧 CSL 文档改写前的全文校验：遇到未知 citation key 或非法 citation block 时直接报错并停止，不再继续渲染或更新参考文献
- 在闭合方括号扫描阶段忽略 HTML 注释中的 `[@key]`，避免注释内容误参与引用统计、CSL 校验、citation 渲染和 bibliography 提取
- 为 bibliography 增加显式删除受控参考文献块的能力，并将界面与内部命名统一为“插入/更新参考文献”语义
- 精简侧边栏文案与布局：去掉标题区、合并提示文本，并将“插入/更新参考文献”与“删除”按钮放在同一行显示

## 0.2.7 - 2026-03-11

- 增加 `Insert Bibliography / 插入参考文献`，可根据当前文档中仍保留 `@key` 的严格合法 citation block 生成或更新文末受控参考文献块
- 为 bibliography 补齐第一批关键 CSL 映射字段，修复会议论文与章节类条目缺失 `booktitle`、`editor`、卷期页后只剩题名的问题
- 将所有 CSL 文档改写操作统一为“遇到非法 citation key 直接报错并停止”，不再对混合合法/非法 key 做跳过式容错
- 更新 README、AGENTS 与 LAST_RUN，记录 bibliography MVP、受控参考文献块与后续“保留原始 key”路线
## 0.2.6 - 2026-03-11

- 增加单个外部 `CSL File` 设置，复用 `Path Base` 的路径解析模式，并在侧边栏中显示当前 CSL 配置
- 接入 CSL 文内引用渲染：支持严格合法的 `[@key]` / `[@a; @b]` 引用块、同作者同年稳定消歧，以及不同样式驱动的 citation 排序
- 将 citation 输出切换为 CSL 的 `html` 结果，使 `nature` 一类样式能够直接生成 `<sup>...</sup>` 上标引用
- 更新 README、AGENTS 与 LAST_RUN，补充当前支持的 CSL 特性、替换式渲染约定与运行时依赖说明

## 0.2.5 - 2026-03-11

- 调整当前文档引用统计逻辑：按闭合右方括号回扫同一行最近左方括号，只统计真正闭合且 citation key 全部合法的引用块
- 为文献库缓存补充合法 citation key 集合缓存，避免侧边栏每次统计时重复构建 key 集合
- 在侧边栏中增加非法 citation key 错误提示，并让输入或删除 `]` 时在下一帧立即刷新当前文档引用统计

## 0.2.4 - 2026-03-11

- 梳理文献库缓存与当前文档轻量状态缓存的边界，明确 `invalidateLibrary()` 与 `reloadLibraryNow()` 两条路径的职责
- 修复侧边栏“待刷新”状态与懒加载重读之间的同步链路，在输入 `[@query` 触发建议检索后自动恢复真实的已索引条目数
- 调整侧边栏与活动栏的交互细节：移除重复的设置入口，将状态文案改为“待刷新”，并优化活动栏引号图标与 `Refresh Cache` 按钮样式

## 0.2.3 - 2026-03-11

- 增加插件显示语言设置，支持在英文与简体中文之间切换设置页、侧边栏与提示文案
- 在切换显示语言后自动执行一次与侧边栏按钮一致的缓存刷新，并立即重绘侧边栏内容
- 清理已失效的国际化遗留文案与旧建议注册兼容分支，简化启动与本地化逻辑
- 将当前文档引用统计文案调整为更直白的“共 x 条 / y 次”，降低理解门槛

## 0.2.2 - 2026-03-11

- 在左侧活动栏增加 BibTeX 侧边栏按钮与面板，集中展示路径基准、已配置 BibTeX 文件数量与已索引条目数量
- 为侧边栏面板增加缓存刷新与快速打开设置入口，并将摘要区调整为标签和值分两行显示，缓解长选项文本拥挤问题
- 增加当前文档引用统计，在侧边栏同时显示方括号引用中的唯一 citation key 数量与总出现次数

## 0.2.1 - 2026-03-11

- 调整候选项作者显示为更接近 author-date 的样式：单作者显示单作者、双作者使用 `and`、三位及以上显示首位作者加 `et al.`
- 扩展 BibTeX 字段解析与展示，增加 DOI 信息，并把候选项元信息布局调整为“年份与作者 + DOI + 第三行期刊名”
- 收紧候选列表整体宽度与元信息间距，并微调作者字重，提升信息密度与视觉层级

## 0.2.0 - 2026-03-11

- 将插件从单文件结构重构为模块化 `src/` 布局，保留轻量入口 [`main.js`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\main.js) 并把核心逻辑迁移到 `src/plugin.js`
- 拆分 BibTeX 数据层、建议查询与渲染、键鼠交互兜底、设置页和通用工具模块，降低后续维护与继续重构的耦合成本
- 为新模块补充简体中文注释，并同步 AGENTS、LAST_RUN 等项目记忆，记录新的目录结构、常用检查命令与排查入口

## 0.1.2 - 2026-03-09

- 修复候选列表鼠标点击选择无效的问题，并拦截后续点击事件避免插入引用后额外换行
- 增加候选栏打开时按回车默认插入第一条建议的兜底逻辑，提升无宿主选中态时的键盘体验
- 将候选触发规则从正文裸 `@query` 收敛回未闭合方括号引用中的 `@query`，更适合 `[@a; @b]` 多文献引用场景
- 更新 README、AGENTS 与 LAST_RUN，记录 fork 来源、当前方括号触发语法和已放弃的“默认真选中第一项”尝试

## 0.1.1 - 2026-03-09

- 重构候选项渲染流程，改为返回 HTML 字符串，修复 `object HTMLDivElement` 与空白候选项问题
- 优化候选列表样式：标题独立为第一行，年份改为更醒目的标签，标题与作者均支持最多两行后截断
- 统一运行时代码中的候选项类名为 `bibtex-cite-*`，清理遗留 `zotero` 命名残留
- 为宿主 `.auto-suggest-container` 与 `.typ-suggestion` 增加宽度约束，避免长标题或长作者将列表横向撑爆
- 增加待选框视口内夹取逻辑，处理靠右输入、误按回车与重新触发时的越界和位置漂移问题

## 0.1.0 - 2026-03-09

- 首次发布 `bibtex-citation` Typora Community Plugin
- 从早期实现逐步收敛为 BibTeX-only 工作流，不再依赖外部文献管理器或原生构建步骤
- 支持从一个或多个本地 `.bib` 文件检索文献，并在 Typora 中输入 `@query` 时提供候选项
- 支持按 `citation key`、标题、作者、年份、期刊等字段搜索，并在确认后插入 `@citationKey`
- 支持多个 BibTeX 文件路径配置，重复 `citation key` 以更靠前的配置项为准
- 增加相对路径基准模式，可在“相对当前 Markdown 文件”“相对 Typora 打开的目录”“仅接受绝对路径”之间切换
- 修复 Typora 设置页兼容性问题与插件加载显示问题
- 同步中文 README、项目记忆与本地接手文档
