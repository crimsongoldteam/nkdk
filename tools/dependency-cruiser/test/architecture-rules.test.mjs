import assert from "node:assert/strict"
import test from "node:test"
import {
  findProductionCycleComponents,
  findProductionCycleViolations,
} from "../src/cycle-analysis.mjs"
import { analyzeCruiseResult } from "../src/cruise-result.mjs"
import { cruiseFixture } from "../src/fixture-cruise.mjs"
import {
  addImplementationReachabilityViolations,
  findImplementationReachabilityViolations,
} from "../src/reachability.mjs"

const result = cruiseFixture()

test("project cruise не смешивает циклы с нарушениями границ", () => {
  const analyzed = analyzeCruiseResult(result, [])
  assert.equal(
    analyzed.summary.violations.some(
      ({ rule }) => rule.name === "no-circular-production"
    ),
    false
  )
  assert.equal(findProductionCycleComponents(analyzed).length, 1)
})

test("обнаруживает общие нарушения production-графа", () => {
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

test("разрешает связь нейтральных слоёв", () => {
  assert.equal(
    result.summary.violations.some(
      ({ from }) =>
        from === "packages/core/metadata/orchestration/allowed.ts"
    ),
    false
  )
})

test("запрещает runtime, type-only и транзитивное знание реализации", () => {
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

test("линейный обход сохраняет runtime, type-only и транзитивный договор", () => {
  const violations = findImplementationReachabilityViolations(result)

  assert.deepEqual(
    violations.map(({ from, to }) => [from, to]),
    [
      [
        "packages/core/metadata/orchestration/direct-runtime.ts",
        "packages/core/metadata/appliedObjects/example/runtime.ts",
      ],
      [
        "packages/core/metadata/orchestration/direct-type.ts",
        "packages/core/metadata/appliedObjects/example/types.ts",
      ],
      [
        "packages/core/metadata/orchestration/transitive.ts",
        "packages/core/metadata/appliedObjects/example/runtime.ts",
      ],
    ]
  )
})

test("линейный обход находит production-рёбра внутри цикла", () => {
  const violations = findProductionCycleViolations(result)

  assert.deepEqual(
    violations.map(({ from, to }) => [from, to]),
    [
      [
        "packages/core/helpers/runtime/cycle-a.ts",
        "packages/core/helpers/runtime/cycle-b.ts",
      ],
      [
        "packages/core/helpers/runtime/cycle-b.ts",
        "packages/core/helpers/runtime/cycle-a.ts",
      ],
    ]
  )
})

test("смягчает известное reachable-нарушение по источнику и правилу", () => {
  const withoutNativeReachability = {
    ...result,
    summary: {
      ...result.summary,
      violations: result.summary.violations.filter(
        ({ rule }) => rule.name !== "neutral-not-reach-implementations"
      ),
    },
  }
  const checked = addImplementationReachabilityViolations(
    withoutNativeReachability,
    [
      {
        type: "reachability",
        from: "packages/core/metadata/orchestration/transitive.ts",
        rule: { name: "neutral-not-reach-implementations" },
      },
    ]
  )
  const transitive = checked.summary.violations.find(
    ({ from, rule }) =>
      from === "packages/core/metadata/orchestration/transitive.ts" &&
      rule.name === "neutral-not-reach-implementations"
  )

  assert.equal(transitive.rule.severity, "ignore")
})
