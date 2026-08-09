import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const ruleRuntimeTypes = readFileSync(
  "packages/core/metadata/ruleRuntime/property/types.ts",
  "utf8"
)
const typeDescriptionTypes = readFileSync(
  "packages/core/metadata/commonObjects/typeDescription/types.ts",
  "utf8"
)

test("TypeDescription owns its property rule declaration", () => {
  assert.doesNotMatch(ruleRuntimeTypes, /TypeDescriptionAllowedTypes/u)
  assert.match(
    typeDescriptionTypes,
    /interface TypeDescriptionPropertyRule extends BasePropertyRule/u
  )
})
