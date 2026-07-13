# AGENTS.md

## 项目基本信息

- 项目名称：`typora-plugin-bibtex-citation`
- 当前目标仓库名为 `typora-plugin-bibtex-citation`；但插件运行标识、受控注释前缀与当前工作区目录仍可能暂时保留 `bibtex-citation`
- 项目类型：Typora Community Plugin 插件
- 当前最新已发布版本：`0.4.5`
- 主要功能：在 Typora 中输入方括号式或叙述式 `@query` 时，从配置的多个 BibTeX 文件中检索文献条目，并通过 CSL 渲染 citation 与 bibliography
- 运行依赖：
  - Typora Community Plugin Framework
  - 一个或多个本地 `.bib` 文件
  - Node.js `>=22`
- 插件元数据入口：
  - [`manifest.json`](manifest.json)
  - [`main.js`](main.js)

## 目录结构

- [`main.js`](main.js)：轻量入口，只负责转发到 [`src/plugin.js`](src/plugin.js)，尽量不要把业务逻辑回填到这里
- [`src/plugin.js`](src/plugin.js)：主控外观层，负责持有运行时状态、暴露公开方法并把实现委托给 `src/plugin/*.js` 子模块；后续新增主流程优先继续沿用这种 façade + 子模块拆分
- [`src/plugin/document-actions.js`](src/plugin/document-actions.js)：主控层的 CSL 文档改写动作集合，统一处理执行前校验、Markdown 读取、渲染/恢复/bibliography 改写和 reload/刷新链路
- [`src/plugin/runtime.js`](src/plugin/runtime.js)：主控层的启动注册与设置规范化逻辑，负责设置默认化、设置页/侧边栏/建议器装配
- [`src/plugin/library-runtime.js`](src/plugin/library-runtime.js) / [`src/plugin/document-state-runtime.js`](src/plugin/document-state-runtime.js)：主控层的文献库缓存、调度刷新与当前文档状态访问薄封装
- [`src/bibtex/`](src/bibtex)：BibTeX 数据层，负责设置序列化、路径解析、条目解析与缓存；为建议检索、引用校验和 CSL 渲染提供统一条目来源
- [`src/bibtex/source-configs.js`](src/bibtex/source-configs.js) / [`src/document/frontmatter.js`](src/document/frontmatter.js)：文档级 YAML 文件配置层，负责从当前 Markdown frontmatter 读取 `bib` 与 `csl`，并与设置页配置合并
- [`src/csl/`](src/csl)：CSL 工作流层，负责 Pandoc 风格叙述式扫描、模板注册、BibTeX 到 CSL-JSON 映射、citation 渲染、恢复与 bibliography 更新；与 [`src/document/`](src/document) 一起构成“扫描文档 -> 校验 -> 改写”的主链路
- [`src/document/`](src/document)：文档扫描与当前文档轻量状态层，负责闭合方括号提取、引用统计与错误缓存；被侧边栏摘要和 CSL 操作共同复用
- [`src/suggest/`](src/suggest)：建议交互层，负责 `[@query]` 与独立叙述式 `@query` 触发、候选排序、HTML 渲染和键鼠兜底；直接依赖 BibTeX 数据层，不参与 CSL 改写
- [`src/settings/`](src/settings)：设置 UI 层，负责维护 BibTeX/CSL 路径、逐条来源类别和显示语言；设置变更后通过 [`src/plugin.js`](src/plugin.js) 驱动缓存失效和轻量重绘
- [`src/constants.js`](src/constants.js) / [`src/i18n.js`](src/i18n.js)：共享常量与文案层，被设置页、侧边栏和主控装配共同依赖
- [`src/utils/`](src/utils)：通用小工具，当前主要提供 HTML、文本压缩与错误摘要辅助，尽量保持无宿主耦合
- [`style.css`](style.css)：建议列表、侧边栏和活动栏按钮的样式层；与宿主 Typora 样式存在直接耦合，改动时要留意覆盖关系
- [`manifest.json`](manifest.json) / [`package.json`](package.json)：插件元数据与依赖入口，分别影响 Typora 识别和本地 Node 运行环境；当前仓库/包名与插件 `id` 不一定相同
- [`README.md`](README.md)：对外使用说明；能力边界、按钮语义和支持矩阵变更后要同步更新
- [`docs/behavior-rules.md`](docs/behavior-rules.md)：当前行为规则单点说明，集中维护路径解析、引用源、受控 citation、bibliography 与侧边栏/设置页边界
- [`tests/unit/`](tests/unit)：正式单元测试入口，当前覆盖 BibTeX 数据层、CSL 主链路、当前文档状态、建议器、设置页、侧边栏与插件薄封装
- [`tests/support/`](tests/support) / [`tests/fixtures/`](tests/fixtures)：测试辅助环境与真实 CSL 样式夹具；`tests/output/` 不纳入版本控制

## 技术栈与技术路线

### 技术栈

- JavaScript（ES Module 风格）
- Typora Community Plugin Core API
- Node.js 内置模块：`fs`
- CSS：候选列表样式

### 技术路线

- 通过 `EditorSuggest` 监听未闭合方括号引用和独立正文位置中的 `@query` 模式
- 通过设置项维护多个 BibTeX 文件配置，每条记录都显式声明 `path + sourceType`
- 当前 Markdown 开头的 YAML frontmatter 可声明文档级 `bib` 与 `csl`，路径始终按当前 Markdown 文件目录解析
- 路径解析按单条配置的 `sourceType` 严格执行；不再回退到 `process.cwd()` 或其他来源类别
- 读取并解析配置中的 `.bib` 文件，提取 `key`、`title`、`author`、`year`、`journal` 等字段用于搜索和展示
- 插入行为只写入 `@citationKey`，也不修改任何 `.bib` 文件

## 当前状态

- 仓库已完成一轮模块化重构，运行时主入口稳定在 [`main.js`](main.js) -> [`src/plugin.js`](src/plugin.js)；主控层当前已收敛为 façade + 子模块拆分结构，后续新增逻辑默认优先落在 `src/` 对应模块
- 当前核心能力已经覆盖三条主线：BibTeX 检索与建议、当前文档引用统计、基于外部 `CSL File` 的 citation / bibliography 工作流
- 当前文档级 YAML frontmatter 已接入 BibTeX 缓存与 CSL 模板选择；文档级 BibTeX 排在设置页文件前面，文档级 CSL 优先于设置页 CSL
- CSL 工作流已接通“渲染/更新引用、恢复引用、插入/更新参考文献、删除参考文献”这条闭环；受控 citation 块已成为长期持久真源
- 当前开发重点已从建议器交互逐步转向 CSL 能力扩展与 bibliography 工作流完善，尤其是复杂 citation 语法与真机回归稳定性
- 设置页、侧边栏、显示语言与文档统计的联动已经基本成型，但关键体验仍需要在 Typora 真机中持续回归
- 当前 README 已收敛到安装、配置、快速使用与最小排查；更细的行为规则统一沉淀在 `docs/behavior-rules.md`
- 当前平台结论仅限 Windows 真机；Linux 与 macOS 尚未完成系统验证，不应在对外文档中做兼容性承诺
- 仓库当前已具备受版本控制的 Node 单元测试目录；`tests/` 采用 `unit / support / fixtures` 分层，`tests/output/` 仅保留本地产物
- 当前 `npm test` 已覆盖 106 条单元测试，核心逻辑层与大部分高宿主耦合层都已有回归保护；已补到叙述式扫描边界、CSL composite 渲染、`plugin.onload()`、调度链、`BibEntryStore` 异常分支、frontmatter 文件配置与设置页关键非法输入
- `src/plugin.js` 已从重型装配文件收敛为 façade；当前主控层职责按 `document-actions / runtime / library-runtime / document-state-runtime` 拆分，继续重构时优先在这些子模块内演进
- `package.json` 当前仅保留占位性质的 `npm run build`，插件运行不依赖原生构建步骤

### 已知实现特征

#### 模块与入口

- [`src/plugin.js`](src/plugin.js) 当前是主控 façade 层；对外暴露生命周期与公开方法，内部实现优先委托给 `src/plugin/*.js` 子模块
- 主控层当前约定：文档改写动作放进 `src/plugin/document-actions.js`，启动注册放进 `src/plugin/runtime.js`，缓存/调度放进 `src/plugin/library-runtime.js`，当前文档状态访问放进 `src/plugin/document-state-runtime.js`
- BibTeX 读取与缓存集中在 [`src/bibtex/store.js`](src/bibtex/store.js)；后续涉及检索、校验或引用统计时，优先复用这里的合并条目与 `mergedEntryKeySet`
- 项目记忆中的路径优先使用仓库根目录下的相对路径；只有在必须消除歧义时才补充绝对路径，并避免再引用旧的 `D:\Desktop\bibtex-citation`

#### BibTeX 与建议器

- 只检索设置中列出的 BibTeX 文件，不依赖外部文献管理器或 SQLite；重复 citation key 以更靠前的文件为准
- BibTeX 路径在设置页中逐条维护，底层序列化为对象数组；每一条都必须显式声明 `path + sourceType`
- BibTeX 与 CSL 路径解析都已改为逐条 `path + sourceType` 模型；实现时不要再引入基于 `process.cwd()`、Typora 目录或其他来源类别的隐式回退
- Markdown YAML frontmatter 只支持 `bib` 与 `csl`；文档级配置统一经 `src/document/frontmatter.js` 归一化为 `markdown-relative`，再由 `src/bibtex/source-configs.js` 与设置页配置合并
- 建议器支持未闭合方括号中的 `[@key` / `[@a; @b`，以及位于独立正文边界的叙述式 `@key`；中文紧贴、邮箱、URL 与代码上下文不触发叙述式建议
- 候选项必须返回 HTML 字符串而不是 DOM 节点；建议交互兜底逻辑集中在 [`src/suggest/interactions.js`](src/suggest/interactions.js)

#### 当前文档状态与侧边栏

- 当前文档引用统计统一读取严格方括号、已知叙述式 key 与受控 citation 真源；文档状态缓存与错误信息由 [`src/document/`](src/document) 统一维护
- 插件主控通过 `invalidateLibrary()` 标记文献库失效，通过 `reloadLibraryNow()` 执行显式重读；不要混用两者语义
- 侧边栏展示的是 BibTeX 文献库状态、当前文档引用统计和 CSL 操作入口；相关状态刷新优先复用主控已有的轻量重绘链路

#### CSL 工作流

- `Render / Update Citations` 会同时处理严格合法的可见 `[@key]` / `[@a; @b]`、独立且 key 已知的叙述式 `@key` 与已有受控 citation 块；带前缀说明、locator、未知 key 或逗号分隔的可见方括号块不会参与改写
- 所有 CSL 文档改写前都会重新扫描全文；只要任意闭合方括号块中出现未知 key 或非严格 CSL 语法，就直接报错并停止
- CSL 相关模块必须保持懒加载，并通过 `createRequire(import.meta.url)` 解析插件目录内的 `@citation-js/*` 依赖，否则 Typora 设置页与侧边栏可能整块消失
- citation 渲染优先使用 CSL 的 `html` 输出；叙述式引用使用 citeproc `composite` 模式，同作者同年消歧按整篇文档上下文与 bibliography 排序稳定计算

#### Bibliography 与引用源

- 受控 citation 块中的原始 `[@key]` / `@key` 是长期持久真源；不要尝试从 `(Smith, 2024)`、`Smith (2024)`、`[1]` 或 `<sup>1</sup>` 逆向解析回 key
- 统一引用源提取同时识别正文里的严格 `[@key]`、已知叙述式 `@key` 与受控 citation 注释中的原始语法；bibliography、统计和相关校验都应复用这套来源模型
- bibliography 使用文末受控块 `<!-- bibtex-citation:bibliography:start --> ... <!-- bibtex-citation:bibliography:end -->` 做重复更新；删除操作也只删除本插件生成的受控块
- bibliography 相关内部命名统一使用 `upsert` 语义；后续新增逻辑优先沿用这套命名

#### 调试与文档约束

- HTML 注释 `<!-- ... -->` 中的 `[@key]` 会在闭合块扫描阶段被整体忽略；这条规则同时影响统计、校验、citation 渲染和 bibliography 提取
- `tests/` 当前已纳入版本控制；新增测试优先落在 `tests/unit/<domain>/`，共享 mock 放到 `tests/support/`，真实样式夹具放到 `tests/fixtures/`
- `README.md` 负责安装、快速上手与最小排查；只要行为边界变化，就要同时同步 `README.md` 与 `docs/behavior-rules.md`
- 若后续继续拆主控层，优先保持“子模块通过 plugin 公共方法回调，而不是直接绕过主控字段”的约定，避免破坏现有测试中对可覆写方法的替换能力

## 计划

### 当前优先事项

- 在 Typora 真机里持续回归 `CSL File` 路径配置、citation / bibliography 操作链路和插件启动稳定性
- 继续完善 bibliography 工作流，优先让更多流程直接复用受控 citation 块中的原始 `@key`
- 若继续扩展 CSL 能力，优先评估 locator、复杂 citation cluster 与 note-style 的支持边界，并同步更新 README 支持矩阵
- 持续验证侧边栏、显示语言切换、当前文档引用统计与缓存刷新链路的联动稳定性

### 建议后续改进

- 为 BibTeX 解析与检索排序提取更细的纯函数，降低对 Typora 运行时的耦合，便于测试
- 继续补齐 BibTeX 到 CSL-JSON 的字段映射，优先关注 `booktitle`、更完整日期、`editor` 与 `volume/issue/page` 这类会影响排序和样式兼容性的字段
- 若后续继续扩展 citation 工作流，优先围绕受控 citation 块继续完善批量更新、提取与恢复能力，而不是依赖对最终渲染文本做逆向猜测
- 若后续继续补测试，优先围绕 `src/plugin/runtime.js` 的启动 / 注册链与更细的宿主 DOM 结构断言继续加深，而不是重复覆盖已稳定的纯逻辑模块
- 若后续再调整平台承诺、安装路径或规则文档边界，优先保持 README、AGENTS 与 `docs/behavior-rules.md` 三处同步

## 资源

### 常用文件

- 插件入口：[main.js](main.js)
- 插件主控：[src/plugin.js](src/plugin.js)
- 主控动作子模块：[src/plugin/document-actions.js](src/plugin/document-actions.js)
- 主控启动子模块：[src/plugin/runtime.js](src/plugin/runtime.js)
- BibTeX 存储：[src/bibtex/store.js](src/bibtex/store.js)
- 建议交互：[src/suggest/interactions.js](src/suggest/interactions.js)
- 插件清单：[manifest.json](manifest.json)
- 依赖配置：[package.json](package.json)
- 使用说明：[README.md](README.md)

### 常用命令

#### 日常检查

- 安装依赖：`npm install`
- 查看当前 Git 状态：`git status --short --branch`
- 运行项目定义的构建流程：`npm run build`
- 运行当前正式单元测试：`npm test`
- 检查主入口语法：`node --check main.js`
- 检查 `src/` 下所有模块语法：`Get-ChildItem -Recurse .\src -Filter *.js | ForEach-Object { node --check $_.FullName }`

#### 检索与状态

- 检查作者、路径与仓库信息残留：`rg -n -S "adam|D:\\Desktop\\bibtex-citation|zotero|Zotero" .`
- 检查 `package.json`、`README.md` 与 `.gitignore` 是否仍与“本地测试不追踪”的策略一致：`git diff -- package.json README.md .gitignore`
- 检查候选栏触发与点击兜底相关实现：`rg -n "findQuery|registerSuggestInteractions|getSelectedBibtexSuggestionKey|translateX" src`
- 检查当前文档引用统计与 `]` 刷新链路：`rg -n "getCitationState|extractClosedBracketBlocks|getEntryKeySet|scheduleCitationStateRefresh|handleCitationStateKeydown" src`

#### 测试回归

- 全量单测：`npm test`
- 重点检查当前测试覆盖面：`Get-ChildItem -Recurse tests\unit -Filter *.test.mjs`

### 调试与排查提示

- 先确认 Typora 已启用 Community Plugin Framework，再检查本插件是否出现在插件列表中
- 若插件重构后无法加载，先检查 [`main.js`](main.js) 到 [`src/plugin.js`](src/plugin.js) 的导入链是否正常
- 若 BibTeX 检索异常，先检查设置页中的 BibTeX 路径、相对路径解析基准以及是否存在重复 citation key
- 若当前文档统计或 CSL 操作异常，优先检查 [`src/document/state.js`](src/document/state.js) 的闭合块扫描、[`src/bibtex/store.js`](src/bibtex/store.js) 的 `mergedEntryKeySet`，以及统一引用源提取是否仍被复用
- 若建议器交互异常，优先确认候选项仍返回 HTML 字符串，并检查 [`src/suggest/interactions.js`](src/suggest/interactions.js) 的键鼠兜底是否仍在
- 若样式或弹层定位异常，优先检查 [`style.css`](style.css) 与宿主样式覆盖关系，以及是否仍通过 `transform` 做越界夹取
