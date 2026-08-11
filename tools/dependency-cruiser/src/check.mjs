import { readFileSync } from "node:fs"
import { assertNoNewViolations } from "./check-result.mjs"
import { createCruiseResult } from "./cruise-result.mjs"
import {
  assertCyclesNotWorse,
  createCycleBaseline,
} from "./cycle-baseline.mjs"
import { cycleBaselinePath } from "./paths.mjs"
import { reportRuntimeInternalImports } from "./runtime-public-imports.mjs"

const cycleBaseline = JSON.parse(readFileSync(cycleBaselinePath, "utf8"))
const result = createCruiseResult({ ignoreKnown: true, writeEnhanced: false })
reportRuntimeInternalImports(result)
assertNoNewViolations(result)
assertCyclesNotWorse(result, cycleBaseline)

const cycleMetrics = createCycleBaseline(result).components
const cycleModuleCount = cycleMetrics.reduce(
  (total, { modules }) => total + modules.length,
  0
)
const cycleDependencyCount = cycleMetrics.reduce(
  (total, { dependencyCount }) => total + dependencyCount,
  0
)

console.log(
  `Архитектура: новых нарушений границ нет; ${result.summary.ignore} нарушений границ учтено baseline. ` +
    `Циклы: ${cycleMetrics.length} компонент, ${cycleModuleCount} модулей, ${cycleDependencyCount} внутренних зависимостей.`
)
