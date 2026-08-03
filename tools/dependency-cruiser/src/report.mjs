import { resolve } from "node:path"
import { createCruiseResult } from "./cruise-result.mjs"
import { cruiseResultPath, reportsDir } from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"

createCruiseResult({ ignoreKnown: false })
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
