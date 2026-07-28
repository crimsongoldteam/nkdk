import { describe, expect, it } from "vitest"
import { createRuleOrderAggregate } from "./aggregate"
import type { RuleOrderObservation } from "./types"

const observation = (fields: string[], configuration: string): RuleOrderObservation => ({
  configuration,
  sourceXmlPath: `/xml/${configuration}.xml`,
  logicalAddress: `Тест.${configuration}`,
  xmlNodeLogicalAddress: `Тест.${configuration}`,
  ruleId: "rule",
  source: {
    candidate: "rules.ts#Rule",
    filePath: "/rules.ts",
    exportName: "Rule",
    propertyPath: [],
    declarationOrder: ["name", "use", "indexing", "a", "b", "c"],
    numericOrder: {},
  },
  itemType: "TestItem",
  fields,
})

describe("createRuleOrderAggregate", () => {
  it("reports opposite order for the same pair", () => {
    const aggregate = createRuleOrderAggregate({ witnessLimit: 2 })
    aggregate.accept(observation(["name", "use", "indexing"], "all"))
    aggregate.accept(observation(["name", "indexing", "use"], "erp"))
    const [report] = aggregate.finish()
    expect(report?.conflicts).toEqual([
      {
        leftBeforeRight: expect.objectContaining({ before: "indexing", after: "use", count: 1 }),
        rightBeforeLeft: expect.objectContaining({ before: "use", after: "indexing", count: 1 }),
      },
    ])
  })

  it("does not conflict when fields are absent", () => {
    const aggregate = createRuleOrderAggregate()
    aggregate.accept(observation(["name", "use"], "all"))
    aggregate.accept(observation(["name", "indexing"], "erp"))
    expect(aggregate.finish()[0]?.conflicts).toEqual([])
  })

  it("rejects duplicate fields", () => {
    const aggregate = createRuleOrderAggregate()
    expect(() => aggregate.accept(observation(["name", "name"], "all"))).toThrow("повторяется")
  })

  it("reports a three-field cycle", () => {
    const aggregate = createRuleOrderAggregate()
    aggregate.accept(observation(["a", "b"], "all"))
    aggregate.accept(observation(["b", "c"], "erp"))
    aggregate.accept(observation(["c", "a"], "trade"))
    expect(aggregate.finish()[0]?.cycles).toEqual([["a", "b", "c"]])
  })
})
