import { performance } from "node:perf_hooks"
import { resolve } from "node:path"
import { registerCoreMetadata } from "../metadata/register.ts"
import { exportJSONSchemaGraph } from "../metadata/validation/projectFileSchema.ts"
import { discoverValidationProjectFiles } from "../metadata/validation/projectFiles.ts"
import { createValidationSchemaCache } from "../metadata/validation/projectValidationPasses.ts"

registerCoreMetadata()

const context = {
  version: process.env["NKDK_VERSION"] ?? "2.20",
  defaultLanguage: process.env["NKDK_DEFAULT_LANGUAGE"] ?? "ru",
}

const projectDir = process.argv[2] === undefined ? undefined : resolve(process.argv[2])

if (projectDir !== undefined) {
  const files = discoverValidationProjectFiles(projectDir)
  const byKind = countBy(files, (file) => file.kind)
  console.log(
    [
      "project",
      `dir=${projectDir}`,
      `files=${files.length}`,
      `forms=${byKind.form ?? 0}`,
      `properties=${byKind.properties ?? 0}`,
      `configuration=${byKind.configuration ?? 0}`,
    ].join(" ")
  )
}

const graphStartedAt = performance.now()
const graph = exportJSONSchemaGraph({
  context,
  roots: [{ key: "form", name: "ClientApplicationForm", includeNestedChildItems: true }],
})
const graphMs = performance.now() - graphStartedAt
const graphSchemaNames = Object.keys(graph.schemas)

console.log(
  [
    "formGraph",
    `roots=${Object.keys(graph.roots).length}`,
    `schemas=${graphSchemaNames.length}`,
    `rootRefs=${schemaRefCount(graph.roots.form)}`,
    `schemaRefs=${graphSchemaNames.reduce((sum, name) => sum + schemaRefCount(graph.schemas[name]), 0)}`,
    `buildMs=${graphMs.toFixed(2)}`,
  ].join(" ")
)

if (globalThis.gc !== undefined) globalThis.gc()
const before = process.memoryUsage()
const cache = createValidationSchemaCache(context)
const compileProfile = cache.compileAll()
if (globalThis.gc !== undefined) globalThis.gc()
const after = process.memoryUsage()

console.log(
  [
    "compileAll",
    `totalMs=${compileProfile.totalMs.toFixed(2)}`,
    `formMs=${compileProfile.formMs.toFixed(2)}`,
    `propertiesMs=${compileProfile.propertiesMs.toFixed(2)}`,
    `rssBeforeMb=${mb(before.rss)}`,
    `rssAfterMb=${mb(after.rss)}`,
    `heapUsedAfterMb=${mb(after.heapUsed)}`,
  ].join(" ")
)

function countBy(items, keyOf) {
  const result = {}
  for (const item of items) {
    const key = keyOf(item)
    result[key] = (result[key] ?? 0) + 1
  }
  return result
}

function schemaRefCount(value) {
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + schemaRefCount(item), 0)
  if (value === null || typeof value !== "object") return 0

  let count = 0
  for (const [key, entry] of Object.entries(value)) {
    if (key === "$ref" && typeof entry === "string") count += 1
    count += schemaRefCount(entry)
  }
  return count
}

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(1)
}
