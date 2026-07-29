import { describe, expect, it } from "vitest"
import type { RuleOrderObservation, RuleOrderSource } from "./types"
import {
  assertObservationSubsequence,
  createCanonicalRuleOrderAggregate,
  deriveCanonicalRuleOrders,
} from "./canonicalOrder"

const source = (overrides: Partial<RuleOrderSource> = {}): RuleOrderSource => ({
  candidate: "test/rules.ts#Rules",
  filePath: "/test/rules.ts",
  exportName: "Rules",
  propertyPath: [],
  declarationOrder: ["name", "comment", "use", "indexing", "unseen"],
  ...overrides,
})

const observation = (
  fields: readonly string[],
  overrides: Partial<RuleOrderObservation> & { source?: RuleOrderSource } = {}
): RuleOrderObservation => ({
  configuration: "all",
  sourceXmlPath: "/xml/Test.xml",
  logicalAddress: "Тест.Объект",
  xmlNodeLogicalAddress: "Тест.Объект",
  ruleId: "rule",
  source: source(),
  itemType: "TestItem",
  fields,
  ...overrides,
})

describe("deriveCanonicalRuleOrders", () => {
  it("derives the same orders from incremental observations", () => {
    const observations = [
      observation(["name", "use", "indexing"]),
      observation(["name", "comment", "indexing"]),
    ]
    const aggregate = createCanonicalRuleOrderAggregate()
    for (const item of observations) aggregate.accept(item)

    expect(aggregate.finish()).toEqual(deriveCanonicalRuleOrders(observations))
  })

  it("uses observed constraints and declaration order as a stable tie-break", () => {
    const result = deriveCanonicalRuleOrders([
      observation(["name", "use", "indexing"]),
      observation(["name", "comment", "indexing"]),
    ])

    expect(result[0]?.propertyKeys).toEqual(["name", "comment", "use", "indexing"])
    expect(result[0]?.observationCount).toBe(2)
  })

  it("rejects an opposite pair before producing an order", () => {
    expect(() =>
      deriveCanonicalRuleOrders([
        observation(["use", "indexing"]),
        observation(["indexing", "use"]),
      ])
    ).toThrow(/use.*indexing|indexing.*use/)
  })

  it("rejects a three-node cycle", () => {
    const cyclicSource = source({ declarationOrder: ["a", "b", "c"] })
    expect(() =>
      deriveCanonicalRuleOrders([
        observation(["a", "b"], { source: cyclicSource }),
        observation(["b", "c"], { source: cyclicSource }),
        observation(["c", "a"], { source: cyclicSource }),
      ])
    ).toThrow(/цикл/i)
  })

  it("does not constrain absent properties", () => {
    const result = deriveCanonicalRuleOrders([
      observation(["name", "use"]),
      observation(["name", "indexing"]),
    ])

    expect(result[0]?.propertyKeys).toEqual(["name", "use", "indexing"])
  })

  it("не включает ненаблюдавшиеся свойства", () => {
    const result = deriveCanonicalRuleOrders([observation(["name", "use"])])

    expect(result[0]?.propertyKeys).toEqual(["name", "use"])
    expect(result[0]?.propertyKeys).not.toContain("unseen")
  })

  it("использует порядок объявления для несвязанных наблюдавшихся ключей", () => {
    expect(
      deriveCanonicalRuleOrders([
        observation(["name", "use"]),
        observation(["name", "comment"]),
      ])[0]?.propertyKeys
    ).toEqual(["name", "comment", "use"])
  })

  it("rejects an observation key missing from the declaration", () => {
    expect(() => deriveCanonicalRuleOrders([observation(["unknown"])])).toThrow(/unknown/)
  })

  it("sorts results bytewise by candidate", () => {
    const result = deriveCanonicalRuleOrders([
      observation(["name"], { source: source({ candidate: "z/rules.ts#Rules" }) }),
      observation(["name"], { source: source({ candidate: "a/rules.ts#Rules" }) }),
    ])

    expect(result.map((order) => order.source.candidate)).toEqual(["a/rules.ts#Rules", "z/rules.ts#Rules"])
  })
})

describe("assertObservationSubsequence", () => {
  it("reports the candidate, configuration and XML path", () => {
    expect(() =>
      assertObservationSubsequence({
        order: ["name", "use"],
        observation: observation(["use", "name"], {
          configuration: "erp",
          sourceXmlPath: "/xml/erp/Test.xml",
        }),
      })
    ).toThrow(/test\/rules\.ts#Rules.*erp.*\/xml\/erp\/Test\.xml/)
  })
})
