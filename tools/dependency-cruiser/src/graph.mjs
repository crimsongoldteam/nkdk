import { resolve } from "node:path"
import { createCruiseResult } from "./cruise-result.mjs"
import { cruiseResultPath, reportsDir } from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"

createCruiseResult({ ignoreKnown: false })
runDepcruise(
  "depcruise-fmt",
  [
    "--output-type",
    "html",
    "--collapse",
    "^packages/(?:core/metadata/[^/]+|[^/]+)",
    "--output-to",
    resolve(reportsDir, "graph.html"),
    cruiseResultPath,
  ],
  { capture: false }
)
