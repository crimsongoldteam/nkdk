import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("childItems rules не знает конкретные элементы", () => {
  const source = readFileSync(
    "packages/rules/metadata/forms/commonObjects/childItems/rules.ts",
    "utf8"
  )
  assert.doesNotMatch(source, /forms\/elements|\.\.\/\.\.\/elements/u)
})

test("context helper не импортирует ruleRuntime barrel", () => {
  const source = readFileSync("packages/rules/metadata/context/helpers.ts", "utf8")
  assert.doesNotMatch(source, /from "\.\.\/ruleRuntime"/u)
})

test("типы элементов импортируют дерево YAML из leaf contract", () => {
  for (const element of ["contextMenu", "searchControlAddition"]) {
    const source = readFileSync(`packages/rules/metadata/forms/elements/${element}/types.ts`, "utf8")
    assert.doesNotMatch(source, /commonObjects\/childItems\/types/u)
  }
})
