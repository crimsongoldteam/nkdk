import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("form element orchestration owns the generic implementation", () => {
  for (const file of ["fn", "helper", "ruleFactory", "singletonName", "toEnterprise", "toJSONSchema", "types"]) {
    const source = readFileSync(`packages/core/metadata/orchestration/formElement/${file}.ts`, "utf8")
    assert.doesNotMatch(source, /forms\/elements/u, file)
  }
})
