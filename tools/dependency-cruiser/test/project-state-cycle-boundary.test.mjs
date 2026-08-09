import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("projectState leaf contracts не импортируют реализации", () => {
  for (const file of ["fileIdentity.ts", "readToken.ts", "fileUpdate.ts", "dependencyValidation.ts"]) {
    const source = readFileSync(`packages/core/metadata/projectState/contracts/${file}`, "utf8")
    assert.doesNotMatch(source, /\.\.\/(?:binary|fileUpdate|readSession|service|store)/u)
    assert.doesNotMatch(source, /\.\.\/\.\.\/validation/u)
  }
})

test("projectState service не импортирует project worker или worker handle", () => {
  const source = readFileSync("packages/core/metadata/projectState/service.ts", "utf8")
  assert.doesNotMatch(source, /\.\.\/project\/preparedYamlProjectWorkerPool/u)
  assert.doesNotMatch(source, /\.\.\/workerPool\/handle/u)
})

test("production graph не содержит циклов", () => {
  const baseline = JSON.parse(readFileSync(".dependency-cruiser-cycle-baseline.json", "utf8"))
  assert.deepEqual(baseline, { version: 1, components: [] })
})
