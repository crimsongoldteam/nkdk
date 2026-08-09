import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import test from "node:test"

test("metadata rule runtime uses the ruleRuntime path", () => {
  assert.equal(existsSync("packages/core/metadata/ruleRuntime"), true)
})
