import { rm } from "node:fs/promises";

for (const path of [".next", "out", "coverage"]) {
  await rm(path, { recursive: true, force: true });
}
console.log("Build artifacts cleaned. Data files were preserved.");
