import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

for (const file of ["types.ts", "compiler.ts", "projectProjection.ts", "providerRegistry.ts"]) {
  test(`resourceTopology/core/${file} не импортирует adapters и верхние metadata-слои`, () => {
    const source = readFileSync(`packages/core/metadata/resourceTopology/core/${file}`, "utf8")
    assert.doesNotMatch(
      source,
      /\.\.\/(?:adapters|ruleRuntime|project|configurationIndex)\//u
    )
  })
}
