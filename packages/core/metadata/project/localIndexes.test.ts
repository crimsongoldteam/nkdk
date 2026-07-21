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
      dependencies: [
        {
          yamlPath: ["Элементы", 0, "Путь"],
          rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }, { propertyKey: "path" }],
        },
      ],
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
})
