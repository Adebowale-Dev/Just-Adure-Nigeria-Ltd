import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const testsDir = join(process.cwd(), "tests");
const vitestEntry = join(process.cwd(), "node_modules", "vitest", "vitest.mjs");
const testFiles = readdirSync(testsDir)
  .filter((file) => file.endsWith(".test.js"))
  .sort();

for (const file of testFiles) {
  console.log(`\n--- ${file} ---`);
  const result = spawnSync(process.execPath, [vitestEntry, "run", join(testsDir, file)], {
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