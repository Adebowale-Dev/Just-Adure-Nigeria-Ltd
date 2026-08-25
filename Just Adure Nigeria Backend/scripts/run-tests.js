import { existsSync, readdirSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const testsDir = join(process.cwd(), "tests");
const vitestEntry = join(process.cwd(), "node_modules", "vitest", "vitest.mjs");
const requestedFiles = process.argv.slice(2);
const testFiles = requestedFiles.length > 0
  ? requestedFiles.map((file) => isAbsolute(file) ? file : resolve(process.cwd(), file))
  : readdirSync(testsDir).filter((file) => file.endsWith(".test.js")).sort().map((file) => join(testsDir, file));

for (const file of testFiles) {
  if (!existsSync(file)) {
    console.error(`Test file not found: ${file}`);
    process.exit(1);
  }
  console.log(`\n--- ${file.replace(`${testsDir}\\`, "").replace(`${testsDir}/`, "")} ---`);
  const result = spawnSync(process.execPath, [vitestEntry, "run", file], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}