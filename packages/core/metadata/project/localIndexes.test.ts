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
      metadata: {},
      dependencies: [
        {
          yamlPath: ["Элементы", 0, "Путь"],
          rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }, { propertyKey: "path" }],
        },
      ],
    })
  })
})
