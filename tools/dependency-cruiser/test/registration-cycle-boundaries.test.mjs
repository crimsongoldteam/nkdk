import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("types.ts не выполняет runtime-регистрацию", () => {
  const source = readFileSync(
    "packages/rules/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemAuto/types.ts",
    "utf8"
  )
  assert.doesNotMatch(source, /registerTypeRule/u)
  assert.doesNotMatch(source, /from "\.\/(?:fromXML|fromYAML|toYAML)"/u)
})

test("commonObjects не импортирует form adapter", () => {
  const source = readFileSync("packages/rules/metadata/commonObjects/index.ts", "utf8")
  assert.doesNotMatch(source, /childFormNames\/syncExternalFromXML/u)
})
