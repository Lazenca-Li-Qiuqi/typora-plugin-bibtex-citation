# CSL Test Fixtures

这些文件用于 `tests/unit/` 下的 CSL 单元测试，不参与插件运行时资源加载。

## 来源

- `tests/fixtures/csl/styles/` 下的 `.csl` 文件来自官方样式仓库：<https://github.com/citation-style-language/styles>
- `tests/fixtures/csl/locales/` 下的 locale XML 来自官方 locale 仓库：<https://github.com/citation-style-language/locales>

## 当前覆盖

- `apa.csl`：典型 author-date 样式
- `chicago-author-date.csl`：另一类 author-date 规则
- `ieee.csl`：典型 numeric 样式
- `nature.csl`：紧凑 numeric 样式
- `elsevier-vancouver.csl`：Vancouver 家族样式
- `american-meteorological-society.csl`：气象领域常见样式
- `locales-en-US.xml`：英文 locale
- `locales-zh-CN.xml`：简体中文 locale

## 使用建议

- 优先通过 `npm test` 覆盖真实样式下的 citation 渲染、恢复与 bibliography 产出
- 新增样式 fixture 时，优先补对应的单元测试断言，而不是依赖手工回归
- 若后续需要覆盖模板继承、法学样式或脚注样式，可继续按需补充 fixture
