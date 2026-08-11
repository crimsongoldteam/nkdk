import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import test from "node:test"

test("metadata item augmenter registry belongs to ruleRuntime", () => {
  assert.equal(existsSync("packages/rules/metadata/importFromXml/metadataItemAugmenter.ts"), false)
  assert.equal(existsSync("packages/rules/metadata/ruleRuntime/metadataItem/augmenterRegistry.ts"), true)
})
