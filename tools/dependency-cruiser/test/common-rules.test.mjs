import assert from "node:assert/strict"
import test from "node:test"
import { cruiseFixture } from "../src/fixture-cruise.mjs"

test("обнаруживает общие нарушения production-графа", () => {
  const result = cruiseFixture()
  const names = new Set(
    result.summary.violations.map(({ rule }) => rule.name)
  )
  const expected = [
    "no-circular-production",
    "no-unresolvable",
    "no-production-to-test",
    "no-runtime-to-dev-dependency",
  ]

  for (const name of expected) assert.equal(names.has(name), true, name)
})
