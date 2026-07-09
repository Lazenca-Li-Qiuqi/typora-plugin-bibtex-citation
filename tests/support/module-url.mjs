import path from "node:path";
import { pathToFileURL } from "node:url";

import { workspaceDir } from "./paths.mjs";

/**
 * 功能：为动态导入的 ESM 模块追加缓存击穿参数，避免跨测试文件共享模块状态。
 * 输入：相对测试工作区根目录的模块路径。
 * 输出：可直接传给 `import()` 的 file URL。
 */
export function createFreshModuleUrl(relativePath) {
  const absolutePath = path.resolve(workspaceDir, relativePath);
  const url = new URL(pathToFileURL(absolutePath).href);
  url.searchParams.set("t", `${Date.now()}-${Math.random()}`);
  return url.href;
}
