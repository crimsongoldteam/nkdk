import assert from "node:assert/strict"
import test from "node:test"
import { serializeBaseline } from "../src/baseline-format.mjs"

test("сохраняет все нарушения из итоговой сводки", () => {
  const violations = [
    { type: "dependency", rule: { name: "not-in-allowed" } },
    { type: "dependency", rule: { name: "no-circular-production" } },
    {
      type: "reachability",
      rule: { name: "neutral-not-reach-implementations" },
    },
  ]

  assert.deepEqual(
    JSON.parse(serializeBaseline({ summary: { violations } })),
    violations
  )
})
