import { assertNoNewViolations } from "./check-result.mjs"
import { createCruiseResult } from "./cruise-result.mjs"

const result = createCruiseResult({ ignoreKnown: true, writeEnhanced: false })
assertNoNewViolations(result)

console.log(
  `Архитектура: новых нарушений нет; ${result.summary.ignore} нарушений учтено baseline. ` +
    `${result.summary.totalCruised} модулей, ${result.summary.totalDependenciesCruised} зависимостей.`
)
