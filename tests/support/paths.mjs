import path from "node:path";
import { fileURLToPath } from "node:url";

const helperDir = path.dirname(fileURLToPath(import.meta.url));

export const workspaceDir = path.resolve(helperDir, "..", "..");
export const fixtureRoot = path.join(workspaceDir, "tests", "fixtures", "csl");
export const styleRoot = path.join(fixtureRoot, "styles");
export { helperDir };
