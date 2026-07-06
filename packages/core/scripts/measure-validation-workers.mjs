import { performance } from "node:perf_hooks"
import { validateProject } from "../dist/index.js"

const projectDir = process.argv[2]
if (!projectDir) {
  console.error("Использование: node scripts/measure-validation-workers.mjs <projectDir>")
  process.exit(2)
}

const concurrency = Number(process.env.NKDK_VALIDATION_CONCURRENCY ?? "4")
const startedAt = performance.now()
const result = await validateProject({ projectDir, concurrency })
const elapsedMs = Math.round(performance.now() - startedAt)

const bySeverity = new Map()
const bySource = new Map()
for (const diagnostic of result.diagnostics) {
  bySeverity.set(diagnostic.severity, (bySeverity.get(diagnostic.severity) ?? 0) + 1)
  bySource.set(diagnostic.source, (bySource.get(diagnostic.source) ?? 0) + 1)
}

console.log(
  JSON.stringify(
    {
      projectDir,
      concurrency,
      elapsedMs,
      diagnostics: {
        total: result.diagnostics.length,
        bySeverity: Object.fromEntries([...bySeverity.entries()].sort()),
        bySource: Object.fromEntries([...bySource.entries()].sort()),
      },
      memory: process.memoryUsage(),
    },
    null,
    2
  )
)
