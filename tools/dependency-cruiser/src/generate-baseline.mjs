import { existsSync, writeFileSync } from "node:fs"
import { serializeBaseline } from "./baseline-format.mjs"
import { baselinePath } from "./paths.mjs"
import { createCruiseResult } from "./cruise-result.mjs"

const mode = process.argv[2]
if (!["--dry-run", "--write-initial"].includes(mode)) {
  throw new Error(
    "Использование: generate-baseline.mjs --dry-run|--write-initial"
  )
}

const result = createCruiseResult({ ignoreKnown: false })
const counts = Map.groupBy(
  result.summary.violations,
  ({ rule }) => rule.name
)

console.log(
  `Проанализировано модулей: ${result.summary.totalCruised}, зависимостей: ${result.summary.totalDependenciesCruised}`
)
for (const [name, violations] of counts) {
  console.log(`${name}: ${violations.length}`)
}

if (mode === "--write-initial") {
  if (existsSync(baselinePath)) {
    throw new Error("Первоначальный baseline уже существует")
  }
  writeFileSync(baselinePath, serializeBaseline(result))
}
