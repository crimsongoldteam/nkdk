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
registerMetadataItemCollectionRule({
  propertyType: "TestImplicitKeyCollection" as PropertyRuleType,
  itemRule: {
    itemType: "TestImplicitKeyItem",
    properties: {
      name: { type: "string", xml: "Name", xmlParents: ["Properties"] },
      value: { type: "string", xml: "Value", yaml: "Значение" },
    },
  },
  xmlElement: "Item",
  keyField: "name",
})

describe("importMetadataItemCollectionFromXMLToYAML", () => {
  it.each([
    ["обычный объект-контейнер", { Item: { Name: "A" } }, { Элементы: { A: {} } }],
    [
      "контейнер со списком",
      { Item: [{ Name: "A" }, { Name: "B", Value: "v" }] },
      { Элементы: { A: {}, B: { Значение: "v" } } },
    ],
    ["одиночное тело", { Name: "A", Value: "v" }, { Элементы: { A: { Значение: "v" } } }],
    [
      "массив обёрток",
      [{ Item: { Name: "A" } }, { Item: { Name: "B" } }],
      { Элементы: { A: {}, B: {} } },
    ],
    [
      "массив обёрток с вложенным массивом",
      [{ Item: [{ Name: "A" }, { Name: "B", Value: "v" }] }],
      { Элементы: { A: {}, B: { Значение: "v" } } },
    ],
    ["массив с одиночной обёрткой", [{ Item: { Name: "A" } }], { Элементы: { A: {} } }],
    ["массив тел", [{ Name: "A" }, { Name: "B" }], { Элементы: { A: {}, B: {} } }],
  ])("normalizes legacy XML collection shapes in the direct traversal: %s", (_name, value, expected) => {
    expect(runDirectRule("TestRecordCollection" as PropertyRuleType, { Items: value }).yaml).toEqual(expected)
  })

  it("omits an undefined collection from direct YAML", () => {
    expect(runDirectRule("TestRecordCollection" as PropertyRuleType, { Items: undefined }).yaml).toEqual({})
  })

  it("builds record YAML and preserves deferred item paths", () => {
    const recordResult = runDirectRule("TestRecordCollection", {
      Items: { Item: { Name: "Первый", Value: "a", Path: "x" } },
    })

    expect(recordResult.yaml).toEqual({ Элементы: { Первый: { Значение: "a", Путь: "x" } } })
    expect(recordResult.localIndexes.dependencies).toEqual([
      {
        yamlPath: ["Элементы", "Первый", "Путь"],
        rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }, { propertyKey: "path" }],
      },
    ])
  })

  it("uses the XML item name when the key field is omitted from YAML", () => {
    const result = runDirectRule("TestImplicitKeyCollection", {
      Items: { Item: { Properties: { Name: "Первый" }, Value: "a" } },
    })

    expect(result.yaml).toEqual({ Элементы: { Первый: { Значение: "a" } } })
  })

  it("builds array YAML and preserves deferred item paths", () => {
    const arrayResult = runDirectRule("TestArrayCollection", {
      Items: { Item: { Name: "Первый", Value: "a", Path: "x" } },
    })

    expect(arrayResult.yaml).toEqual({ Элементы: [{ Имя: "Первый", Значение: "a", Путь: "x" }] })
    expect(arrayResult.localIndexes.dependencies).toEqual([
      {
        yamlPath: ["Элементы", 0, "Путь"],
        rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }, { propertyKey: "path" }],
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

  it("завершает прямой импорт ошибкой, если адресуемый элемент коллекции не имеет имени", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      mockContextFromXML({ forReference: true }),
      indexCollector,
      "Владелец.A"
    )

    expect(() =>
      runDirectRule(
        "TestIndexedRecordCollection" as PropertyRuleType,
        { Items: { Item: { _uuid: "11111111-1111-1111-1111-111111111111" } } },
        context
      )
    ).toThrow("содержит элемент без имени")
  })

  it("uses recordYamlKeyFromYAML for record YAML keys", () => {
    const result = runDirectRule("TestCustomKeyCollection", {
      Items: { Item: { Name: "Первый", Value: "a", Path: "x" } },
    })

    expect(result.yaml).toEqual({ Элементы: { "Ключ-Первый": { Значение: "a", Путь: "x" } } })
    expect(result.localIndexes.dependencies).toEqual([
      {
        yamlPath: ["Элементы", "Ключ-Первый", "Путь"],
        rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }, { propertyKey: "path" }],
      },
    ])
  })
})

function runDirectRule(type: PropertyRuleType, xml: Record<string, unknown>, context = mockContextFromXML()) {
  const collector = createLocalIndexesCollector()
  const importContext = { ...context, exportToYAML: { toTyped: true } }
  const yaml = importPropertiesFromXMLToYAML({
    context: importContext,
    rule: {
      itemType: "TestOwner",
      properties: { items: { type, xml: "Items", yaml: "Элементы" } },
    } as MetadataItemRule,
    sources: [{ context: importContext, xml }],
    yamlPath: [],
    rulePath: [],
    collector,
  })
  return { yaml, localIndexes: collector.finish() }
}
