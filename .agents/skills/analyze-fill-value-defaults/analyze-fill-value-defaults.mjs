#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const skillDir = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(skillDir, "../../..")
const result = spawnSync("pnpm", [
  "--filter", "@nkdk/rules", "exec", "tsx",
  "scripts/analyze-fill-value-defaults.ts",
  ...process.argv.slice(2),
], {
  cwd: repositoryRoot,
  stdio: "inherit",
})

if (result.error !== undefined) {
  process.stderr.write(`Не удалось запустить анализ FillValue: ${result.error.message}\n`)
  process.exitCode = 1
} else if (result.signal !== null) {
  process.kill(process.pid, result.signal)
} else {
  process.exitCode = result.status ?? 1
}
