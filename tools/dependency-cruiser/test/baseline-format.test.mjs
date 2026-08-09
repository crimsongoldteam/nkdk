import assert from "node:assert/strict"
import test from "node:test"
import { serializeBaseline } from "../src/baseline-format.mjs"

test("сохраняет только нарушения границ metadata-слоёв", () => {
  const violations = [
    { type: "dependency", rule: { name: "not-in-allowed" } },
    { type: "dependency", rule: { name: "no-circular-production" } },
    { type: "dependency", rule: { name: "no-unresolvable" } },
    {
      type: "reachability",
      rule: { name: "neutral-not-reach-implementations" },
    },
  ]

  assert.deepEqual(
    JSON.parse(serializeBaseline({ summary: { violations } })),
    [violations[0], violations[3]]
  )
})
