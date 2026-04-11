# 行为规则说明

本文档集中说明 `typora-plugin-bibtex-citation` 当前版本已经实现的行为规则、约束与边界，便于后续维护、排错与扩展功能时快速核对。

## 1. 总体原则

- 插件只读取本地 `.bib` 与单个 `.csl` 文件，不修改任何 `.bib` 文件。
- 插件在文档中的写入行为只发生在两类场景：
  - 插入候选后的 `@citationKey`
  - CSL 工作流生成或更新的受控 citation / bibliography 块
- 当前所有 CSL 文档改写都以“先全文扫描、再整体校验、最后统一改写”为原则；不会在发现非法块后继续部分执行。

## 2. BibTeX 文件与路径规则

### 2.1 BibTeX 文件列表

- 设置页中的 `BibTeX Files` 以“逐条编辑”的形式维护。
- 底层设置使用对象数组序列化，每一条都必须显式声明：
  - `path`
  - `sourceType`
- 空路径不会被加入列表。

### 2.2 来源类别与解析规则

- `markdown-relative`
  - 只按当前正在编辑的 Markdown 文件目录解析。
  - 若当前 Markdown 文件路径不可确定，则该条配置直接失败。
- `typora-relative`
  - 只按 Typora 当前打开目录解析。
  - 若 Typora 当前打开目录不可确定，则该条配置直接失败。
- `absolute`
  - 只接受绝对路径。
  - 若 `path` 不是绝对路径，则该条配置直接失败。

### 2.3 严格解析原则

- 每一条文件配置只按自己声明的 `sourceType` 解析。
- 不会从 `markdown-relative` 回退到 Typora 当前打开目录。
- 不会从 `markdown-relative` 或 `typora-relative` 回退到进程工作目录。
- 不会因为某条路径无法解析而自动尝试其他来源类别。

### 2.4 多文件合并与重复 key

- 插件会合并所有已配置的 BibTeX 文件。
- 若多个文件出现相同 `citation key`，以配置列表中更靠前的文件为准。
- 缺失或不可读取的 BibTeX 文件会被跳过，并输出警告。

### 2.5 文献库缓存

- 主控通过 `invalidateLibrary()` 只标记缓存失效，不立即重读。
- `reloadLibraryNow()` 会显式清空缓存并立刻重读。
- `BibEntryStore` 会根据文件 `mtime` 变化决定是否更新缓存内容。

## 3. 建议器规则

### 3.1 触发条件

- 只在未闭合的方括号引用中触发建议，例如：
  - `[@smith`
  - `[@smith2024; @doe`
- 正文里的裸 `@smith` 不触发建议。

### 3.2 查询范围与排序

- 查询会命中 `citation key`、标题、作者、期刊、年份等字段。
- 排序优先级：
  - `citation key` 前缀命中优先
  - 然后按 key 字典序
- 当 query 已经精确等于某个 key 时，不再继续提示。

### 3.3 插入规则

- 候选项插入时只写入 `@citationKey`。
- 不会自动展开 bibliography，也不会改写 `.bib` 文件。
- 当候选栏打开但宿主没有显式选中项时，按回车会兜底插入第一条建议。
- 鼠标 pointer 交互与越界位置修正由建议器交互层兜底处理。

## 4. 文档扫描与统计规则

### 4.1 闭合方括号扫描

- 当前文档状态与 CSL 工作流都依赖闭合方括号扫描。
- 扫描只识别同一行内的闭合方括号块，不跨行拼接。
- HTML 注释 `<!-- ... -->` 中的 `[@key]` 会被整体忽略。

### 4.2 当前文档引用统计

- 统计依赖合法 citation source，而不是简单字符串匹配。
- 统计结果包含：
  - 唯一 key 数
  - 总引用次数
- 统计会同时识别：
  - 正文里可见的严格 `[@key]` / `[@a; @b]`
  - 受控 citation 注释中保存的原始 `[@key]`
- 如果扫描到未知 key 或非法 citation block，当前文档状态会返回错误，并把统计结果归零。

## 5. CSL 引用源规则

### 5.1 严格合法的 citation block

当前仅把以下形式视为可用于 CSL 改写的严格 citation block：

- `[@key]`
- `[@a; @b]`

### 5.2 当前不支持的形式

以下形式当前不会被当作合法 CSL citation source：

- `[see @key]`
- `[@key, p. 3]`
- `[@a, @b]`
- `[key]`
- 含 suffix、locator、prefix 或更复杂 cluster 语法的引用块

### 5.3 统一引用源模型

- bibliography、当前文档统计、citation 渲染前校验都复用统一引用源提取逻辑。
- 统一引用源同时识别：
  - 正文里严格合法的 `[@key]`
  - 受控 citation 块中保存的原始 `[@key]`

## 6. 受控 citation 规则

### 6.1 真源原则

- 受控 citation 块中的原始 `[@key]` 是长期持久真源。
- 不会尝试从 `(Smith 2024)`、`[1]` 或 `<sup>1</sup>` 逆向推断 key。

### 6.2 渲染规则

- `Render / Update Citations` 会同时处理：
  - 正文里严格合法的可见 citation block
  - 已存在的受控 citation 块
- 渲染输出优先使用 CSL 的 `html` 结果。
- 同作者同年消歧会结合整篇文档上下文与 bibliography 顺序稳定计算。
- 如果切换了 `CSL File`，可以直接再次执行 `Render / Update Citations`，不需要先恢复。

### 6.3 恢复规则

- `Restore Citations` 只恢复本插件生成的受控 citation 块。
- 恢复结果是原始 `[@key]` 或 `[@a; @b]`。

### 6.4 执行前校验

- 所有 citation 渲染与 bibliography 更新前，都会重新扫描全文。
- 只要任意闭合方括号块中存在：
  - 未知 key
  - 非严格 CSL 语法
- 对应操作就会直接报错并停止。

## 7. Bibliography 规则

### 7.1 来源

- `Insert / Update Bibliography` 会同时读取：
  - 正文里严格合法的 `[@key]`
  - 受控 citation 块中的原始 `[@key]`

### 7.2 更新方式

- bibliography 使用受控块包裹：

```html
<!-- bibtex-citation:bibliography:start -->
...
<!-- bibtex-citation:bibliography:end -->
```

- 再次执行时会更新已有受控 bibliography 块，而不是重复追加。

### 7.3 删除规则

- `Remove Bibliography` 只删除本插件生成的受控 bibliography 块。
- 不会删除用户手写的普通参考文献段落。

## 8. 侧边栏规则

- 侧边栏显示当前配置摘要、当前索引状态、当前文档引用统计与操作按钮。
- 侧边栏会显示：
  - 单个 `CSL File`
  - 已配置 BibTeX 文件数量
  - 已索引条目数量
  - 当前文档引用统计
- 路径类摘要会直接显示 `path (sourceType)`。
- 修改 BibTeX 文件列表后，`Indexed Entries` 会先显示“待刷新 / Refresh needed”。
- 侧边栏当前不再显示底部说明文字；行为规则统一以文档为准。

## 9. 设置页规则

- 支持 `English` 与 `简体中文` 两种显示语言。
- 切换显示语言后，会立即更新设置页与侧边栏文案，但不会强制重读文献库。
- 每一条 BibTeX 文件配置都要分别维护：
  - `path`
  - `sourceType`
- `CSL File` 当前只支持配置一个文件，但也必须单独维护：
  - `path`
  - `sourceType`
- 当前设置页已移除全局 `Path Base`。

## 10. 当前明确未支持的能力

- locator
- prefix / suffix
- 更复杂 citation cluster
- note-style / 脚注式 citation
- 从最终渲染文本逆向恢复 key

## 11. 维护建议

- 新增功能时，优先先定义“规则变化”再改实现。
- 只要行为规则发生变化，就应同步更新：
  - `README.md`
  - `AGENTS.md`
  - 本文档
- 对影响主链路的规则变更，应优先补对应单元测试，再修改实现。
