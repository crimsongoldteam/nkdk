import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import test from "node:test"

test("metadata item augmenter registry belongs to ruleRuntime", () => {
  assert.equal(existsSync("packages/core/metadata/importFromXml/metadataItemAugmenter.ts"), false)
  assert.equal(existsSync("packages/core/metadata/ruleRuntime/metadataItem/augmenterRegistry.ts"), true)
})
