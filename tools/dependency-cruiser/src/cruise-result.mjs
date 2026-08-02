import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import {
  baselinePath,
  cruiseResultPath,
  projectRoot,
  reportsDir,
} from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"
import { addProductionCycleViolations } from "./cycle-analysis.mjs"
import { softenKnownViolations } from "./known-violations.mjs"
import { addImplementationReachabilityViolations } from "./reachability.mjs"

export const MIN_MODULES = 1800

function hasRelevantWorkingTreeChanges() {
  const result = runDepcruise(
    "git",
    [
      "status",
      "--porcelain=v1",
      "--untracked-files=normal",
      "--",
      "packages",
      ".dependency-cruiser.mjs",
      "tsconfig.dependency-cruiser.json",
      "tools/dependency-cruiser/src",
    ],
    { cwd: projectRoot }
  )
  return result.stdout.trim().length > 0
}

export function assertCompleteCruiseResult(result) {
  const modules = result.summary?.totalCruised ?? 0
  if (modules < MIN_MODULES) {
    throw new Error(
      `Неполный dependency-граф: ${modules} модулей, ожидалось не меньше ${MIN_MODULES}`
    )
  }

  const environment = result.summary?.environment
  const typescript = environment?.transpilersFound?.find(
    ({ name }) => name === "typescript"
  )
  const availableExtensions = new Set(
    environment?.extensionsFound
      ?.filter(({ available }) => available)
      .map(({ extension }) => extension) ?? []
  )
  const hasTypeScript =
    typescript?.available === true &&
    typescript.currentVersion === "typescript@6.0.3"
  const hasExtensions = [".ts", ".tsx", ".d.ts"].every((extension) =>
    availableExtensions.has(extension)
  )
  if (!hasTypeScript || !hasExtensions) {
    throw new Error("TypeScript-парсер dependency-cruiser недоступен или неполон")
  }
}

export function createCruiseResult({
  ignoreKnown = false,
  outputPath = cruiseResultPath,
  writeEnhanced = true,
} = {}) {
  mkdirSync(reportsDir, { recursive: true })
  const args = [
    "--config",
    ".dependency-cruiser.mjs",
    "--output-type",
    "json",
    "--output-to",
    outputPath,
    ...(hasRelevantWorkingTreeChanges() ? ["--no-cache"] : []),
    "packages",
  ]
  runDepcruise("dependency-cruise", args, {
    cwd: projectRoot,
    capture: false,
  })
  const rawResult = JSON.parse(readFileSync(outputPath, "utf8"))
  const knownViolations =
    ignoreKnown && existsSync(baselinePath)
      ? JSON.parse(readFileSync(baselinePath, "utf8"))
      : []
  const analyzedResult = addImplementationReachabilityViolations(
    addProductionCycleViolations(rawResult)
  )
  const result = ignoreKnown
    ? softenKnownViolations(analyzedResult, knownViolations)
    : analyzedResult
  assertCompleteCruiseResult(result)
  if (writeEnhanced) {
    writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
  }
  return result
}
