import path from "node:path";

import { styleRoot, workspaceDir } from "./paths.mjs";

/**
 * 功能：构造用于注册本地 CSL fixture 的最小 mock 插件对象。
 * 输入：样式文件名或绝对路径。
 * 输出：可供 `ensureCslTemplate()` 使用的插件 mock。
 */
export function createMockPluginForStyle(styleFile = "apa.csl") {
  const cslFilePath = path.isAbsolute(styleFile)
    ? styleFile
    : path.join(styleRoot, styleFile);

  return {
    settings: {
      get(key) {
        if (key === "cslFile") {
          return JSON.stringify({
            path: cslFilePath,
            sourceType: "absolute",
          });
        }
        return "";
      },
    },
    i18n: {
      t: {
        cslPathRequired: "missing csl",
        cslFileNotFound: "missing file: ",
      },
    },
    app: {
      vault: {
        path: workspaceDir,
      },
    },
  };
}
