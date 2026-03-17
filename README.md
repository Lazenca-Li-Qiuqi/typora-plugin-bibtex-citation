# typora-plugin-bibtex-citation

`typora-plugin-bibtex-citation` 是一个 Typora Community Plugin 插件，用于在 Typora 的方括号引用语法中输入 `@query` 时，从一个或多个已配置的本地 BibTeX 文件中检索文献条目，并插入对应的引用键；也支持基于单个本地 `.csl` 文件把严格合法的 citation block 渲染为文中引用。

插件只会读取你在设置中配置的 `.bib` 文件与 `.csl` 文件，并在文档中插入 citation key 或渲染后的文中引用。它不会修改任何 `.bib` 文件，也不依赖外部参考文献管理器或 SQLite。

本项目 fork 自 `adam-coates/typora-plugin-zotero`，并在此基础上逐步调整为面向本地 BibTeX 文件的引用工作流。

![Version](https://img.shields.io/badge/version-v0.3.5-2f6feb)
![Platform](https://img.shields.io/badge/platform-Windows-1f883d)
![Node](https://img.shields.io/badge/node-%3E%3D22-8a2be2)
![Typora Plugin](https://img.shields.io/badge/Typora-Community%20Plugin-0a7ea4)

## 功能概览

- 从一个或多个本地 `.bib` 文件检索文献
- 支持配置单个本地 `.csl` 文件作为引用样式
- 支持按 `citation key`、标题、作者、期刊、年份等字段搜索
- 在 Typora 的方括号引用语法中输入 `@query` 触发候选列表
- 在左侧活动栏提供 BibTeX 面板按钮，可查看当前配置概览、当前文档引用统计并执行缓存刷新、citation 渲染/恢复与 bibliography 更新
- 支持在插件设置中切换 `English` 与 `简体中文` 两种界面语言
- 多个 BibTeX 路径支持逐条添加、编辑、删除
- 相对路径支持多种解析基准模式
- 当多个 BibTeX 文件存在相同 `citation key` 时，以配置列表中更靠前的文件为准

## 环境要求

- Typora
- Typora Community Plugin Framework
- Node.js `>=22`（用于在插件目录下执行 `npm install`）
- 一个或多个本地 `.bib` 文件
- 如需使用 `Render / Update Citations / 渲染/更新引用`，还需要一个可读取的本地 `.csl` 文件

## 平台说明

- 当前仅在 Windows 环境下完成验证与日常使用。
- Linux 与 macOS 目前没有系统测试，暂时不承诺兼容性。

## 安装

### 依赖前提

1. 安装并启用 Typora Community Plugin Framework
   - 项目地址：<https://github.com/typora-community-plugin/typora-community-plugin>
2. 准备至少一个本地 `.bib` 文件

### 安装插件

将本仓库克隆或复制到 Typora Community Plugin Framework 的插件目录。若你后续也同步重命名了 GitHub 仓库，推荐插件目录名与仓库名统一为 `typora-plugin-bibtex-citation`；当前插件运行标识 `id` 仍保持为 `bibtex-citation`。

下面的示例以 Windows 上的 Typora Community Plugin Framework 目录为准：

```powershell
cd $env:UserProfile\.typora\community-plugins\plugins\
git clone https://github.com/Lazenca-Liqiuqi/typora-plugin-bibtex-citation.git typora-plugin-bibtex-citation
```

将插件目录放到正确位置后，请在插件目录下执行一次 `npm install`。当前项目不需要额外构建步骤。

当前 `npm install` 主要用于安装 citation 渲染依赖，例如 `@citation-js/core` 与 `@citation-js/plugin-csl`。

## 测试

当前仓库已内置受版本控制的 Node 单元测试，覆盖 BibTeX 数据层、CSL 渲染主链路、当前文档统计、建议器、设置页、侧边栏与插件薄封装逻辑。

在插件目录下可直接运行：

```powershell
npm test
```

当前测试入口默认执行 `tests/unit/` 下的正式单元测试；`tests/fixtures/` 中的 CSL 样式文件会作为真实样式夹具参与回归。当前测试总量为 86 条，已覆盖 BibTeX 数据层、CSL 主链路、当前文档状态、建议器、设置页、侧边栏，以及 `plugin.onload()`、调度链和异常分支。

当前实现的完整行为规则、边界与约束已整理到 [docs/behavior-rules.md](docs/behavior-rules.md)。

### 启用插件

1. 打开 Typora
2. 使用 `Ctrl + .` 打开全局设置
3. 进入 Community Plugins 页面
4. 在已安装插件列表中启用 `BibTeX Citations`

## 配置 BibTeX 文件路径

启用插件后，打开插件设置，可以在 `BibTeX Files` 区域逐条维护 `.bib` 文件路径，并在 `CSL File` 区域配置单个 `.csl` 样式路径。

你也可以在设置页顶部通过 `Display Language / 显示语言` 切换插件界面语言。切换后插件会立即更新设置页与侧边栏文案，但不会强制重新读取 `.bib` 文件。

推荐流程：

1. 在 `Path Base` 中选择路径解析方式
2. 在输入框中填写一个 `.bib` 文件路径
3. 点击 `Add BibTeX File` 添加到列表
4. 如需修改已有路径，直接编辑对应输入框
5. 如需删除某项，点击该行右侧的 `Remove`
6. 在 `CSL File` 中填写一个 `.csl` 路径；该项只能配置一个文件

可填写的路径示例：

```text
./references.bib
../bib/library.bib
D:/Literature/shared.bib
./styles/american-meteorological-society.csl
```

当前支持 3 种路径基准模式：

- `Relative to the current Markdown file`
- `Relative to the folder currently opened in Typora`
- `Absolute paths only`

更完整的路径解析、重复 key 优先级与缓存规则请查看 [docs/behavior-rules.md](docs/behavior-rules.md)。

## 使用教学

### 1. 准备 BibTeX 条目

确保你的 `.bib` 文件包含常见的 BibTeX 条目，例如：

```bibtex
@article{smith2024example,
  title   = {An Example Paper},
  author  = {Smith, John},
  year    = {2024},
  journal = {Journal of Examples}
}
```

### 2. 在方括号引用中输入 `@query`

在 Markdown 文档里先输入 `[`，再在方括号内输入 `@` 和检索关键词。你可以按以下信息搜索：

- `citation key`
- 标题
- 作者
- 期刊
- 年份

例如：

```text
[@smith
[@2024
[@example
[@smith2024example; @doe
```

### 3. 选择候选项并插入引用

插件会弹出候选列表。你可以使用方向键选择目标条目后按回车，也可以直接用鼠标点击候选项。若候选栏打开但尚未有宿主选中项，按回车会默认插入第一条建议。插入效果示例：

```text
[@smith2024example]
```

多文献引用示例：

```text
[@smith2024example; @doe2023study]
```

候选列表插入这一步只会写入引用键，不会自动展开完整参考文献格式，也不会修改原始 `.bib` 文件。

### 4. 使用侧边栏 BibTeX 面板与 CSL 操作

启用 Typora Community Plugin Framework 的活动栏后，左侧会出现一个新的 BibTeX 图标按钮。点击后可打开插件侧边栏面板，用于查看当前配置与文档状态，并执行以下操作：

- `Refresh Cache`
- `Render / Update Citations / 渲染/更新引用`
- `Restore Citations / 恢复引用`
- `Insert / Update Bibliography / 插入/更新参考文献`
- `Remove Bibliography / 删除参考文献`

面板同时会显示当前 `Path Base`、`CSL File`、已配置 BibTeX 文件数量、已索引条目数量和当前文档中的引用统计（中文界面显示为“共 x 条 / y 次”）。

当你修改 `Path Base` 或 BibTeX 文件列表后，侧边栏中的 `Indexed Entries` 会先显示“待刷新”。此时如果你手动点击 `Refresh Cache`，或直接在文档里输入 `[@query` 触发建议检索，插件都会重新读取文献库并把已索引条目数恢复为真实值。

这几个按钮的最小理解可以这样记：

- `Render / Update Citations`：把严格合法的 `[@key]` / `[@a; @b]` 或已有受控 citation 块渲染为当前 CSL 样式的文中引用
- `Restore Citations`：把受控 citation 块恢复成原始 `[@key]`
- `Insert / Update Bibliography`：根据当前文档中的合法引用源生成或更新受控 bibliography 块
- `Remove Bibliography`：只删除本插件生成的受控 bibliography 块

更细的 citation 语法、受控注释格式、真源规则、报错停止条件与 bibliography 更新方式请查看 [docs/behavior-rules.md](docs/behavior-rules.md)。

## CSL 支持边界

- 当前支持严格形式的 `[@key]` 与 `[@a; @b]`，并支持 bibliography 更新、同作者同年消歧、数字型引用与上标型数字引用。
- 当前 citation 排序、citation-number 与 bibliography 顺序由 `.csl` 样式和 CSL 处理器决定，插件不手写排序规则。
- 当前不支持 prefix、locator、suffix、更复杂 citation cluster，以及 note-style citation。
- 更完整的规则、边界与真源约束请直接查看 [docs/behavior-rules.md](docs/behavior-rules.md)。

## 常见排查

### 候选与检索

- 若在方括号里输入 `@query` 后没有出现候选项，先确认 Typora Community Plugin Framework 和 `BibTeX Citations` 插件都已启用
- 确认你当前是在未闭合的方括号引用里输入，例如 `[@smith`，而不是正文里的裸 `@smith`
- 若检索结果不完整或不准确，检查 `.bib` 文件是否为常见 BibTeX 写法，以及条目是否包含 `title`、`author`、`year`、`journal`、`journaltitle`、`booktitle`、`publisher` 等常见字段
- 若多个文件中存在同名 `citation key`，最终会以配置顺序更靠前的文件为准

### 路径与文件

- 确认 `BibTeX Files` 列表中对应路径仍然存在，且文件扩展名为 `.bib`
- 若路径没有生效，优先检查拼写、权限问题，以及它是否按照当前 `Path Base` 解析到预期目录
- 若使用相对路径，确认它是相对于当前 Markdown 文件目录、Typora 当前打开目录，还是只接受绝对路径，这取决于你当前选择的 `Path Base`
- 缺失或不可读取的 BibTeX 文件会被跳过，并在控制台输出警告

### Citation 与 CSL

- 若 `Render / Update Citations` 或 `Insert / Update Bibliography` 失败，先确认已经配置了可读取的 `.csl` 文件
- 若渲染或 bibliography 更新失败，优先检查当前文档是否含有未知 key，或不受支持的 citation 语法
- 如果你更换了 `CSL File` 后想刷新已经渲染过的 citation，直接再次执行 `Render / Update Citations` 即可
- 更详细的报错停止条件与规则边界请查看 [docs/behavior-rules.md](docs/behavior-rules.md)

## 说明

- 插件 ID：`bibtex-citation`
- 插件名称：`BibTeX Citations`
- 当前已验证平台：Windows
- Linux 与 macOS：尚未测试
- 当前仓库包名推荐使用 `typora-plugin-bibtex-citation`
- 当前插件运行标识与受控注释前缀仍保持为 `bibtex-citation`
