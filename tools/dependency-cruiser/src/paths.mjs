import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const toolRoot = fileURLToPath(new URL("..", import.meta.url))
export const projectRoot = resolve(toolRoot, "../..")
export const toolBinDir = resolve(toolRoot, "node_modules/.bin")
export const fixturesRoot = resolve(toolRoot, "fixtures")
export const fixtureConfigPath = resolve(toolRoot, "fixture.config.mjs")
export const reportsDir = resolve(projectRoot, "reports/dependency-cruiser")
export const cruiseResultPath = resolve(reportsDir, "current.json")
export const baselinePath = resolve(
  projectRoot,
  ".dependency-cruiser-known-violations.json"
)
