import { describe, expect, it } from "vitest"
import { PropertyRuleType } from "../orchestration/property/registry"
import { registerTypeRule } from "../orchestration/property/typeRuleRegistry"
import { createLocalIndexesCollector } from "./localIndexes"

describe("createLocalIndexesCollector", () => {
  it("stores only paths for properties finalized after the global index is built", () => {
    registerTypeRule("TestDeferredImport" as PropertyRuleType, "finalizeImportedYAML", ({ value }) => value)
    const collector = createLocalIndexesCollector()

    collector.acceptProperty({
      yamlPath: ["Элементы", 0, "Путь"],
      rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }, { propertyKey: "path" }],
      rule: { type: "TestDeferredImport" as PropertyRuleType },
      value: { transient: true },
    })

    expect(collector.finish()).toEqual({
      metadata: {
        events: [
          {
            kind: "property",
            yamlPath: ["Элементы", 0, "Путь"],
            rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }, { propertyKey: "path" }],
            propertyType: "TestDeferredImport",
          },
        ],
      },
    })
  })

  it("preserves compact metadata events without retaining YAML values", () => {
    const rootYaml = { owner: { nested: { retainedOnlyByCaller: true } } }
    const collector = createLocalIndexesCollector()
    const fact = {
      yamlPath: ["Владелец", "Свойство"],
      rulePath: [{ propertyKey: "owner" }, { propertyKey: "property" }],
      rule: { type: "TestMetadataEvent" as PropertyRuleType },
      value: rootYaml,
    }

    collector.acceptProperty(fact)
    collector.completeValue(fact)
    const metadata = collector.finish().metadata

    expect(metadata).toEqual({
      events: [
        {
          kind: "property",
          yamlPath: ["Владелец", "Свойство"],
          rulePath: [{ propertyKey: "owner" }, { propertyKey: "property" }],
          propertyType: "TestMetadataEvent",
        },
        {
          kind: "complete",
          yamlPath: ["Владелец", "Свойство"],
          rulePath: [{ propertyKey: "owner" }, { propertyKey: "property" }],
          propertyType: "TestMetadataEvent",
        },
      ],
    })
    expect(JSON.stringify(metadata)).not.toContain("retainedOnlyByCaller")
  })

  it("собирает одинаковые факты import и validation из одного потока свойств", () => {
    const propertyType = "TestLocalOwnerFact" as PropertyRuleType
    let acceptedProperties = 0
    registerTypeRule(propertyType, "collectLocalFactsFromYAML", ({ fact, writer }) => {
      acceptedProperties += 1
      if (fact.rule.ownerFactRole !== undefined) writer.setOwnerFact(fact.rule.ownerFactRole, fact.value)
    })
    registerTypeRule(propertyType, "finalizeImportedYAML", ({ value }) => value)
    const roles = [
      "type",
      "attributes",
      "tabularSections",
      "standardAttributes",
      "owners",
      "task",
      "registerRecords",
      "chartOfAccounts",
      "extDimensionTypes",
      "accountingFlags",
      "commonAttributeOwnerLinks",
    ] as const
    const facts = roles.map((ownerFactRole, index) => ({
      yamlPath: ["Свойство", index],
      rulePath: [{ propertyKey: ownerFactRole }],
      rule: { type: propertyType, ownerFactRole },
      value: index,
    }))
    const importCollector = createLocalIndexesCollector()
    const validationCollector = createLocalIndexesCollector()

    for (const fact of facts) {
      importCollector.acceptProperty(fact)
      validationCollector.acceptProperty(fact)
    }

    const imported = importCollector.finish()
    const validated = validationCollector.finish()
    expect(imported).toEqual(validated)
    expect(imported.metadata.ownerFacts).toMatchObject({
      type: 0,
      attributes: 1,
      tabularSections: 2,
      standardAttributes: 3,
      owners: 4,
      task: 5,
      registerRecords: 6,
      chartOfAccounts: 7,
      extDimensionTypes: 8,
      accountingFlags: 9,
      commonAttributeOwnerLinks: 10,
    })
    expect(acceptedProperties).toBe(facts.length * 2)
    expect(JSON.stringify(imported)).not.toContain("rootYaml")
  })
})
