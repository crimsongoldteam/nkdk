import assert from "node:assert/strict"
import test from "node:test"

import { metadataReachabilityRules } from "../src/reachability-rules.mjs"

test("runtime cannot reach rules and rules cannot use runtime internals", () => {
  const names = new Set(metadataReachabilityRules.map(({ name }) => name))

  assert.ok(names.has("runtime-does-not-reach-rules"))
  assert.ok(names.has("rules-does-not-reach-runtime-internals"))
  assert.ok(names.has("package-composition-root-only-in-mcp"))
})
