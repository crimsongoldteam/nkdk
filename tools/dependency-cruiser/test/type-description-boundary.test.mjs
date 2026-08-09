import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const orchestrationTypes = readFileSync(
  "packages/core/metadata/orchestration/property/types.ts",
  "utf8"
)
const typeDescriptionTypes = readFileSync(
  "packages/core/metadata/commonObjects/typeDescription/types.ts",
  "utf8"
)

test("TypeDescription owns its property rule declaration", () => {
  assert.doesNotMatch(orchestrationTypes, /TypeDescriptionAllowedTypes/u)
  assert.match(
    typeDescriptionTypes,
    /interface TypeDescriptionPropertyRule extends BasePropertyRule/u
  )
})
