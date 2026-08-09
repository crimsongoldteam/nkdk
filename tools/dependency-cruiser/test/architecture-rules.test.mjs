import assert from "node:assert/strict"
import test from "node:test"
import {
  findProductionCycleComponents,
  findProductionCycleViolations,
} from "../src/cycle-analysis.mjs"
import { analyzeCruiseResult } from "../src/cruise-result.mjs"
import { cruiseFixture } from "../src/fixture-cruise.mjs"
import {
  addReachabilityViolations,
  findReachabilityViolations,
} from "../src/reachability.mjs"
import {
  fixtureReachabilityRules,
  metadataImplementationReachabilityRule,
  metadataReachabilityRules,
} from "../src/reachability-rules.mjs"

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

test("закрепляет направления зависимостей workspace-пакетов", () => {
  const namesFor = (source) =>
    new Set(
      result.summary.violations
        .filter(({ from }) => from === source)
        .map(({ rule }) => rule.name)
    )

  assert.deepEqual(
    namesFor("packages/mcp/src/core-deep.ts"),
    new Set(["mcp-no-workspace-deep-imports"])
  )
  assert.deepEqual(
    namesFor("packages/core/forbidden-mcp.ts"),
    new Set(["core-not-reach-workspace-apps"])
  )
  assert.deepEqual(
    namesFor("packages/platform/src/forbidden-core.ts"),
    new Set(["platform-is-independent"])
  )
  assert.deepEqual(
    namesFor("packages/mcp/src/allowed.ts"),
    new Set()
  )
})

test("diagnostics не достигает validation", () => {
  const names = new Set(
    result.summary.violations
      .filter(
        ({ from }) =>
          from === "packages/core/metadata/diagnostics/forbidden.ts"
      )
      .map(({ rule }) => rule.name)
  )

  assert.deepEqual(names, new Set(["diagnostics-not-reach-validation"]))
})

test("validation не достигает project", () => {
  const names = new Set(
    result.summary.violations
      .filter(
        ({ from }) =>
          from === "packages/core/metadata/validation/forbidden-project.ts"
      )
      .map(({ rule }) => rule.name)
  )

  assert.deepEqual(names, new Set(["validation-not-reach-project"]))
})

test("metadata core не достигает composition roots", () => {
  const names = new Set(
    result.summary.violations
      .filter(
        ({ from }) =>
          from === "packages/core/metadata/ruleRuntime/forbidden-composition.ts"
      )
      .map(({ rule }) => rule.name)
  )

  assert.deepEqual(names, new Set(["metadata-core-not-reach-composition"]))
})

test("все нейтральные слои не достигают concrete-реализаций", () => {
  const namesFor = (source) =>
    new Set(
      result.summary.violations
        .filter(({ from }) => from === source)
        .map(({ rule }) => rule.name)
    )

  for (const source of [
    "packages/core/metadata/diagnostics/forbidden-implementation.ts",
    "packages/core/metadata/projectState/forbidden-implementation.ts",
    "packages/core/metadata/resourceTopology/core/forbidden-implementation.ts",
  ]) {
    assert.equal(namesFor(source).has("neutral-not-reach-implementations"), true, source)
  }
})

test("projectDefinition не достигает координационных слоёв", () => {
  const names = new Set(
    result.summary.violations
      .filter(
        ({ from }) =>
          from === "packages/core/metadata/projectDefinition/forbidden-project.ts"
      )
      .map(({ rule }) => rule.name)
  )

  assert.deepEqual(names, new Set(["project-definition-is-leaf"]))
})

test("закрепляет concrete-матрицу metadata-слоёв", () => {
  const namesFor = (source) =>
    new Set(
      result.summary.violations
        .filter(({ from }) => from === source)
        .map(({ rule }) => rule.name)
    )

  assert.deepEqual(
    namesFor("packages/core/metadata/systemEnumerations/forbidden-forms.ts"),
    new Set(["system-enumerations-stay-lower"])
  )
  assert.deepEqual(
    namesFor("packages/core/metadata/commonObjects/forbidden-applied.ts"),
    new Set(["common-objects-stay-lower"])
  )
  assert.deepEqual(
    namesFor("packages/core/metadata/commonObjects/transitive-forms.ts"),
    new Set(["common-objects-stay-lower"])
  )
  assert.deepEqual(
    namesFor("packages/core/metadata/forms/forbidden-applied.ts"),
    new Set(["forms-stay-lower"])
  )
})

test("разрешает связь нейтральных слоёв", () => {
  assert.equal(
    result.summary.violations.some(
      ({ from }) =>
        from === "packages/core/metadata/ruleRuntime/allowed.ts"
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
    namesFor("packages/core/metadata/ruleRuntime/direct-runtime.ts"),
    new Set(["not-in-allowed", "neutral-not-reach-implementations"])
  )
  assert.deepEqual(
    namesFor("packages/core/metadata/ruleRuntime/direct-type.ts"),
    new Set(["not-in-allowed", "neutral-not-reach-implementations"])
  )
  assert.deepEqual(
    namesFor("packages/core/metadata/ruleRuntime/transitive.ts"),
    new Set(["neutral-not-reach-implementations"])
  )
})

test("линейный обход сохраняет runtime, type-only и транзитивный договор", () => {
  const violations = findReachabilityViolations(
    result,
    [metadataImplementationReachabilityRule]
  )

  assert.deepEqual(
    violations
      .filter(({ from }) => from.startsWith("packages/core/metadata/ruleRuntime/"))
      .map(({ from, to }) => [from, to]),
    [
      [
        "packages/core/metadata/ruleRuntime/direct-runtime.ts",
        "packages/core/metadata/appliedObjects/example/runtime.ts",
      ],
      [
        "packages/core/metadata/ruleRuntime/direct-type.ts",
        "packages/core/metadata/appliedObjects/example/types.ts",
      ],
      [
        "packages/core/metadata/ruleRuntime/transitive.ts",
        "packages/core/metadata/appliedObjects/example/runtime.ts",
      ],
    ]
  )
})

test("нижние зоны не достигают адаптеров напрямую или транзитивно", () => {
  const violations = findReachabilityViolations(
    result,
    fixtureReachabilityRules
  )
  const namesFor = (source) =>
    new Set(
      violations
        .filter(({ from }) => from === source)
        .map(({ rule }) => rule.name)
    )

  for (const source of [
    "packages/core/metadata/example/contracts/direct.ts",
    "packages/core/metadata/example/core/transitive.ts",
  ]) {
    assert.equal(
      namesFor(source).has("example-core-not-reach-adapters"),
      true,
      source
    )
  }
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
  const checked = addReachabilityViolations(
    withoutNativeReachability,
    metadataReachabilityRules,
    [
      {
        type: "reachability",
        from: "packages/core/metadata/ruleRuntime/transitive.ts",
        rule: { name: "neutral-not-reach-implementations" },
      },
    ]
  )
  const transitive = checked.summary.violations.find(
    ({ from, rule }) =>
      from === "packages/core/metadata/ruleRuntime/transitive.ts" &&
      rule.name === "neutral-not-reach-implementations"
  )

  assert.equal(transitive.rule.severity, "ignore")
})
