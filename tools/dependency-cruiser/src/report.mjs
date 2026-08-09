import { resolve } from "node:path"
import { createCruiseResult } from "./cruise-result.mjs"
import {
  findProductionCycleComponents,
  formatProductionCycleReport,
} from "./cycle-report.mjs"
import { cruiseResultPath, reportsDir } from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"

const result = createCruiseResult({ ignoreKnown: false })
console.log(
  formatProductionCycleReport(findProductionCycleComponents(result))
)
runDepcruise(
  "depcruise-fmt",
  [
    "--output-type",
    "err-html",
    "--output-to",
    resolve(reportsDir, "violations.html"),
    cruiseResultPath,
  ],
  { capture: false }
)
