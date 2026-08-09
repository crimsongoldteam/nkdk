import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("configuration context does not own form or validation implementations", () => {
  const source = readFileSync("packages/core/metadata/context/types.ts", "utf8")
  assert.doesNotMatch(source, /from "\.\.\/(?:forms|validation)\//u)
})

test("configuration context не импортирует владельцев расширений", () => {
  const source = readFileSync("packages/core/metadata/context/types.ts", "utf8")
  assert.doesNotMatch(source, /configurationIndex\/(?:collector\/context|exportRuntime)/u)
  assert.doesNotMatch(source, /orchestration\/(?:formElement\/types|yamlImportError)/u)
})

test("property import contracts не импортирует project localIndexes", () => {
  const source = readFileSync(
    "packages/core/metadata/orchestration/property/importYamlTypes.ts",
    "utf8"
  )
  assert.doesNotMatch(source, /project\/localIndexes/u)
})
