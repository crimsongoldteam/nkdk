import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { createDeferredValuePathCollector } from "../property/importYamlTypes"
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
  propertyType: "TestKeyedArrayCollection" as PropertyRuleType,
  itemRule,
  xmlElement: "Item",
  keyField: "value",
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
  propertyType: "TestPreservedPresenceCollection" as PropertyRuleType,
  itemRule,
  xmlElement: "Item",
  keyField: "name",
  preserveItemPropertyPresence: true,
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
    expect(recordResult.deferred).toEqual([
      {
        valuePath: ["Элементы", "Первый", "Путь"],
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
    expect(arrayResult.deferred).toEqual([
      {
        valuePath: ["Элементы", 0, "Путь"],
        rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }, { propertyKey: "path" }],
      },
    ])
    expect(arrayResult.localIndexes.metadata.events).toContainEqual({
      kind: "item",
      itemType: "TestItem",
      name: "Первый",
      yamlPath: ["Элементы", 0],
      rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }],
    })
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

    expect(recordCollector.fragment("test.yaml").entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logicalAddress: "Владелец.A.Элемент.Первый",
          identities: { uuid: "11111111-1111-1111-1111-111111111111" },
        }),
        expect.objectContaining({
          logicalAddress: "Владелец.A.Элемент.Второй",
          identities: { uuid: "22222222-2222-2222-2222-222222222222" },
        }),
      ])
    )
    expect(arrayCollector.fragment("test.yaml").entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logicalAddress: "Владелец.A.Элементы[0]",
          identities: { uuid: "11111111-1111-1111-1111-111111111111" },
        }),
        expect.objectContaining({
          logicalAddress: "Владелец.A.Элементы[1]",
          identities: { uuid: "22222222-2222-2222-2222-222222222222" },
        }),
      ])
    )
    for (const fragment of [recordCollector.fragment("test.yaml"), arrayCollector.fragment("test.yaml")]) {
      expect(fragment.entities.flatMap((entity) => Object.keys(entity))).not.toContain("present")
      expect(JSON.stringify(fragment.entities)).not.toMatch(/aliases|excludedEqualName|userSettingsId|order/)
    }
  })

  it("addresses an array item by keyField when YAML-path addressing is disabled", () => {
    const indexCollector = createConfigurationIndexCollector()
    const xml = {
      Items: {
        Item: { _uuid: "11111111-1111-1111-1111-111111111111", Name: "Первый", Value: "a" },
      },
    }

    runDirectRule(
      "TestKeyedArrayCollection",
      xml,
      withConfigurationIndexCollector(mockContextFromXML({ forReference: true }), indexCollector, "Владелец.A")
    )

    expect(indexCollector.fragment("test.yaml").entities).toContainEqual({
      logicalAddress: "Владелец.A.TestItem.a",
      sourceProjectPath: "test.yaml",
      identities: { uuid: "11111111-1111-1111-1111-111111111111" },
    })
  })

  it("не сохраняет XML alias и явно заданный default в снимке", () => {
    const indexCollector = createConfigurationIndexCollector()
    const aliasRule = {
      itemType: "AliasOwner",
      properties: {
        value: {
          type: "string",
          xml: "CanonicalValue",
          xmlAliases: ["LegacyValue"],
          yaml: "Значение",
        },
        explicitDefault: {
          type: "string",
          xml: "ExplicitDefault",
          yaml: "ЯвноеЗначение",
          defaultValueXML: "default",
          preserveExplicitDefaultXML: true,
        },
      },
    } as MetadataItemRule
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Владелец.A")

    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: aliasRule,
      sources: [{ context, xml: { LegacyValue: "legacy", ExplicitDefault: "default" } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })
    const fragment = indexCollector.fragment("test.yaml")

    expect(yaml).toEqual({ Значение: "legacy", ЯвноеЗначение: "default" })
    expect(fragment.entities.flatMap((entity) => Object.keys(entity))).not.toContain("present")
    expect(JSON.stringify(fragment.entities)).not.toMatch(/aliases|excludedEqualName|userSettingsId|order/)
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
    expect(result.deferred).toEqual([
      {
        valuePath: ["Элементы", "Ключ-Первый", "Путь"],
        rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }, { propertyKey: "path" }],
      },
    ])
    expect(result.localIndexes.metadata.events).toContainEqual({
      kind: "item",
      itemType: "TestItem",
      name: "Ключ-Первый",
      yamlPath: ["Элементы", "Ключ-Первый"],
      rulePath: [{ propertyKey: "items", nestedItemType: "TestItem" }],
    })
  })
})

function runDirectRule(
  type: PropertyRuleType,
  xml: Record<string, unknown>,
  context = mockContextFromXML()
) {
  const collector = createLocalIndexesCollector()
  const deferred = createDeferredValuePathCollector()
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
    deferred,
  })
  return { yaml, localIndexes: collector.finish(), deferred: deferred.finish() }
}
