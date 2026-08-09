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
