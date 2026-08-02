import assert from "node:assert/strict"
import test from "node:test"
import { cruiseFixture } from "../src/fixture-cruise.mjs"

test("разрешает связь нейтральных слоёв", () => {
  const result = cruiseFixture()
  assert.equal(
    result.summary.violations.some(
      ({ from }) =>
        from === "packages/core/metadata/orchestration/allowed.ts"
    ),
    false
  )
})

test("запрещает runtime, type-only и транзитивное знание реализации", () => {
  const result = cruiseFixture()
  const namesFor = (source) =>
    new Set(
      result.summary.violations
        .filter(({ from }) => from === source)
        .map(({ rule }) => rule.name)
    )

  assert.deepEqual(
    namesFor("packages/core/metadata/orchestration/direct-runtime.ts"),
    new Set(["not-in-allowed", "neutral-not-reach-implementations"])
  )
  assert.deepEqual(
    namesFor("packages/core/metadata/orchestration/direct-type.ts"),
    new Set(["not-in-allowed", "neutral-not-reach-implementations"])
  )
  assert.deepEqual(
    namesFor("packages/core/metadata/orchestration/transitive.ts"),
    new Set(["neutral-not-reach-implementations"])
  )
})
