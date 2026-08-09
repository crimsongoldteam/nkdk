import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import {
  baselinePath,
  cruiseResultPath,
  projectRoot,
  reportsDir,
} from "./paths.mjs"
import { runDepcruise } from "./run-depcruise.mjs"
import { softenKnownViolations } from "./known-violations.mjs"
import { addReachabilityViolations } from "./reachability.mjs"
import { metadataReachabilityRules } from "./reachability-rules.mjs"

export const MIN_MODULES = 1800

export function dependencyCruiseArgs(outputPath) {
  return [
    "--config",
    ".dependency-cruiser.mjs",
    "--output-type",
    "json",
    "--output-to",
    outputPath,
    "--no-cache",
    "packages",
  ]
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

export function analyzeCruiseResult(
  rawResult,
  knownViolations = [],
  reachabilityRules = metadataReachabilityRules
) {
  const withoutCycleViolations = {
    ...rawResult,
    summary: {
      ...rawResult.summary,
      violations: rawResult.summary.violations.filter(
        ({ rule }) => rule.name !== "no-circular-production"
      ),
    },
  }
  return softenKnownViolations(
    addReachabilityViolations(
      withoutCycleViolations,
      reachabilityRules,
      knownViolations
    ),
    knownViolations
  )
}

export function createCruiseResult({
  ignoreKnown = false,
  outputPath = cruiseResultPath,
  writeEnhanced = true,
} = {}) {
  mkdirSync(reportsDir, { recursive: true })
  runDepcruise("dependency-cruise", dependencyCruiseArgs(outputPath), {
    cwd: projectRoot,
    capture: false,
  })
  const rawResult = JSON.parse(readFileSync(outputPath, "utf8"))
  const knownViolations =
    ignoreKnown && existsSync(baselinePath)
      ? JSON.parse(readFileSync(baselinePath, "utf8"))
      : []
  const result = analyzeCruiseResult(
    rawResult,
    ignoreKnown ? knownViolations : []
  )
  assertCompleteCruiseResult(result)
  if (writeEnhanced) {
    writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`)
  }
  return result
}
