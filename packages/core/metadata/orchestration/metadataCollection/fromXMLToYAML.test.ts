import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import { PropertyRuleType } from "../property/registry"
import { registerTypeRule } from "../property/typeRuleRegistry"
import type { MetadataItemRule } from "../property/types"
import { registerMetadataItemCollectionRule } from "./ruleFactory"

const itemRule = {
  itemType: "TestItem",
  properties: {
    uuid: { type: "string", xml: "_uuid", forReferenceOnly: true },
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
registerMetadataItemCollectionRule({
  propertyType: "TestIndexedRecordCollection" as PropertyRuleType,
  itemRule,
  xmlElement: "Item",
  keyField: "name",
  configurationIndexUidSegment: "Элемент",
})
registerMetadataItemCollectionRule({
  propertyType: "TestIndexedArrayCollection" as PropertyRuleType,
  itemRule,
  xmlElement: "Item",
  yamlAsArray: true,
  configurationIndexAddressing: "yamlPath",
})
registerMetadataItemCollectionRule({
  propertyType: "TestCustomKeyCollection" as PropertyRuleType,
  itemRule,
  xmlElement: "Item",
  keyField: "name",
  recordYamlKeyFromYAML: ({ name }) => `Ключ-${name}`,
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

  it("uses per-item configuration index addresses for record and array YAML", () => {
    const recordCollector = createConfigurationIndexCollector()
    const arrayCollector = createConfigurationIndexCollector()
    const xml = {
      Items: {
        Item: [
          { _uuid: "11111111-1111-1111-1111-111111111111", Name: "Первый", Value: "a" },
          { _uuid: "22222222-2222-2222-2222-222222222222", Name: "Второй", Value: "b" },
        ],
      },
    }

    runDirectRule(
      "TestIndexedRecordCollection",
      xml,
      withConfigurationIndexCollector(mockContextFromXML({ forReference: true }), recordCollector, "Владелец.A")
    )
    runDirectRule(
      "TestIndexedArrayCollection",
      xml,
      withConfigurationIndexCollector(mockContextFromXML({ forReference: true }), arrayCollector, "Владелец.A")
    )

    expect(recordCollector.fragment("test.yaml").identities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ logicalAddress: "Владелец.A.Элемент.Первый", kind: "uuid" }),
        expect.objectContaining({ logicalAddress: "Владелец.A.Элемент.Второй", kind: "uuid" }),
      ])
    )
    expect(recordCollector.fragment("test.yaml").xmlNodes).toEqual(
      expect.arrayContaining([
        { logicalAddress: "Владелец.A.Элемент.Первый", order: ["uuid", "name", "value"] },
        { logicalAddress: "Владелец.A.Элемент.Второй", order: ["uuid", "name", "value"] },
      ])
    )
    expect(arrayCollector.fragment("test.yaml").identities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ logicalAddress: "Владелец.A[0]", kind: "uuid" }),
        expect.objectContaining({ logicalAddress: "Владелец.A[1]", kind: "uuid" }),
      ])
    )
    expect(arrayCollector.fragment("test.yaml").xmlNodes).toEqual(
      expect.arrayContaining([
        { logicalAddress: "Владелец.A[0]", order: ["uuid", "name", "value"] },
        { logicalAddress: "Владелец.A[1]", order: ["uuid", "name", "value"] },
      ])
    )
  })

  it("uses recordYamlKeyFromYAML for record YAML keys", () => {
    const result = runDirectRule("TestCustomKeyCollection", { Items: { Item: { Name: "Первый", Value: "a" } } })

    expect(result.yaml).toEqual({ Элементы: { "Ключ-Первый": { Значение: "a" } } })
  })
})

function runDirectRule(type: PropertyRuleType, xml: Record<string, unknown>, context = mockContextFromXML()) {
  const collector = createLocalIndexesCollector()
  const yaml = importPropertiesFromXMLToYAML({
    context: { ...context, exportToYAML: { toTyped: true } },
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
