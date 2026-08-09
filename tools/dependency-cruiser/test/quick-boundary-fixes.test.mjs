import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"
import { testModulePattern } from "../src/common-rules.mjs"

test("operation test support lives in a test-only directory", () => {
  assert.equal(
    existsSync("packages/core/metadata/operations/operationTestSupport.ts"),
    false
  )
  assert.equal(
    existsSync("packages/core/metadata/operations/tests/operationTestSupport.ts"),
    true
  )
})

test("operation target declarations own their target kind types", () => {
  const operationTargets = readFileSync(
    "packages/core/metadata/ruleRuntime/property/operationTargets.ts",
    "utf8"
  )

  assert.doesNotMatch(operationTargets, /operations\/types/u)
  assert.match(operationTargets, /export type MetadataNamedChildKind/u)
  assert.match(operationTargets, /export type MetadataFileItemRole/u)
})

test("benchmark modules are classified as test-only code", () => {
  const testModule = new RegExp(testModulePattern, "u")

  assert.equal(
    testModule.test(
      "packages/core/metadata/validation/dataPath/finalizationPredicate.bench.ts"
    ),
    true
  )
})

test("unused validation schema cache is removed", () => {
  const validationTypes = readFileSync(
    "packages/core/metadata/validation/types.ts",
    "utf8"
  )
  const coreIndex = readFileSync("packages/core/index.ts", "utf8")

  assert.equal(
    existsSync("packages/core/metadata/validation/schemaCache.ts"),
    false
  )
  assert.doesNotMatch(validationTypes, /MetadataKind/u)
  assert.doesNotMatch(coreIndex, /MetadataKind/u)
})

test("generic external file handling belongs to property ruleRuntime", () => {
  assert.equal(
    existsSync(
      "packages/core/metadata/forms/commonObjects/dynamicList/externalFile.ts"
    ),
    false
  )
  assert.equal(
    existsSync(
      "packages/core/metadata/ruleRuntime/property/externalFile.ts"
    ),
    true
  )
})
