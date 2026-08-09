import assert from "node:assert/strict"
import test from "node:test"
import { assertNoNewViolations } from "../src/check-result.mjs"

test("принимает граф только с baseline-нарушениями", () => {
  assert.doesNotThrow(() =>
    assertNoNewViolations({
      summary: { error: 0, ignore: 10, violations: [] },
    })
  )
})

test("показывает новое правило и зависимость", () => {
  assert.throws(
    () =>
      assertNoNewViolations({
        summary: {
          error: 1,
          ignore: 10,
          violations: [
            {
              from: "packages/core/metadata/ruleRuntime/new.ts",
              to: "packages/core/metadata/register.ts",
              rule: {
                name: "neutral-not-reach-implementations",
                severity: "error",
              },
            },
          ],
        },
      }),
    /neutral-not-reach-implementations: packages\/core\/metadata\/ruleRuntime\/new\.ts -> packages\/core\/metadata\/register\.ts/u
  )
})
