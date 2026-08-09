import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

for (const file of ["types.ts", "compiler.ts", "projectProjection.ts", "providerRegistry.ts"]) {
  test(`resourceTopology/${file} не импортирует project или ruleRuntime`, () => {
    const source = readFileSync(`packages/core/metadata/resourceTopology/${file}`, "utf8")
    assert.doesNotMatch(source, /\.\.\/(?:project|ruleRuntime)\//u)
  })
}
