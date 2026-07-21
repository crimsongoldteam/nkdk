import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import { PropertyRuleType } from "../property/registry"
import { registerTypeRule } from "../property/typeRuleRegistry"
import type { MetadataItemRule } from "../property/types"
import { registerMetadataItemCollectionRule } from "./ruleFactory"

const itemRule = {
  itemType: "TestItem",
  properties: {
    name: { type: "string", xml: "Name", yaml: "Имя" },
    value: { type: "string", xml: "Value", yaml: "Значение" },
    path: { type: "TestDeferred" as PropertyRuleType, xml: "Path", yaml: "Путь" },
  },
} as MetadataItemRule

registerTypeRule("TestDeferred" as PropertyRuleType, "finalizeImportedYAML", ({ value }) => value)
registerMetadataItemCollectionRule({
  propertyType: "TestRecordCollection" as PropertyRuleType,
  itemRule,
  xmlElement: "Item",
  keyField: "name",
})
registerMetadataItemCollectionRule({
  propertyType: "TestArrayCollection" as PropertyRuleType,
  itemRule,
  xmlElement: "Item",
  yamlAsArray: true,
})

describe("importMetadataItemCollectionFromXMLToYAML", () => {
  it("builds record YAML and preserves deferred item paths", () => {
    const recordResult = runDirectRule("TestRecordCollection", { Items: { Item: { Name: "Первый", Value: "a", Path: "x" } } })

    expect(recordResult.yaml).toEqual({ Элементы: { Первый: { Значение: "a", Путь: "x" } } })
    expect(recordResult.localIndexes.dependencies).toEqual([
      {
        yamlPath: ["Элементы", "Первый", "Путь"],
        rulePath: [
          { propertyKey: "items", nestedItemType: "TestItem" },
          { propertyKey: "path" },
        ],
      },
    ])
  })

  it("builds array YAML and preserves deferred item paths", () => {
    const arrayResult = runDirectRule("TestArrayCollection", { Items: { Item: { Name: "Первый", Value: "a", Path: "x" } } })

    expect(arrayResult.yaml).toEqual({ Элементы: [{ Имя: "Первый", Значение: "a", Путь: "x" }] })
    expect(arrayResult.localIndexes.dependencies).toEqual([
      {
        yamlPath: ["Элементы", 0, "Путь"],
        rulePath: [
          { propertyKey: "items", nestedItemType: "TestItem" },
          { propertyKey: "path" },
        ],
      },
    ])
  })
})

function runDirectRule(type: PropertyRuleType, xml: Record<string, unknown>) {
  const collector = createLocalIndexesCollector()
  const yaml = importPropertiesFromXMLToYAML({
    context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
    rule: {
      itemType: "TestOwner",
      properties: { items: { type, xml: "Items", yaml: "Элементы" } },
    } as MetadataItemRule,
    xml,
    yamlPath: [],
    rulePath: [],
    collector,
  })
  return { yaml, localIndexes: collector.finish() }
}
