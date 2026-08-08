import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

test("configuration context does not own form or validation implementations", () => {
  const source = readFileSync("packages/core/metadata/context/types.ts", "utf8")
  assert.doesNotMatch(source, /from "\.\.\/(?:forms|validation)\//u)
})
