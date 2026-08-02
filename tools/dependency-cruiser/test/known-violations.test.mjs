import assert from "node:assert/strict"
import test from "node:test"
import { softenKnownViolations } from "../src/known-violations.mjs"

test("смягчает точную dependency и reachable по источнику", () => {
  const dependency = {
    type: "dependency",
    from: "from.ts",
    to: "to.ts",
    rule: { name: "not-in-allowed", severity: "error" },
  }
  const reachability = {
    type: "reachability",
    from: "neutral.ts",
    to: "implementation-a.ts",
    rule: {
      name: "neutral-not-reach-implementations",
      severity: "error",
    },
  }
  const result = softenKnownViolations(
    {
      summary: {
        violations: [
          dependency,
          reachability,
          { ...dependency, to: "new.ts" },
        ],
      },
    },
    [
      dependency,
      { ...reachability, to: "implementation-b.ts" },
    ]
  )

  assert.deepEqual(
    result.summary.violations.map(({ rule }) => rule.severity),
    ["ignore", "ignore", "error"]
  )
  assert.equal(result.summary.error, 1)
  assert.equal(result.summary.ignore, 2)
})
