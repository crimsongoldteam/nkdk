import { beforeAll, describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import {
  createConfigurationIndexCollector,
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  parseXmlDocumentWithSaxes,
  serializeYAMLDocument,
  withConfigurationIndexCollector,
  xmlAnnotatedMappingEntries,
} from "@nkdk/runtime"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import {
  createDeferredValuePathCollector,
  createImportedDependentPropertyCollector,
} from "../property/importYamlTypes"
import { importPropertiesFromXMLToYAML } from "../property/fromXMLToYAML"
import { PropertyRuleType } from "../property/registry"
import { registerTypeRule } from "../property/typeRuleRegistry"
import type { MetadataItemRule } from "../property/types"
import { registerMetadataItemCollectionRule } from "./ruleFactory"
import {
  captureTestXmlImport,
  createFailingXmlImportAttempt,
  expectXmlImportInfrastructureFailure,
  xmlImportAttemptPhases,
} from "../../../tests/xmlImportAttempt"

const itemRule = {
  itemType: "TestItem",
  properties: {
    uuid: { type: "string", xml: "_uuid", forReferenceOnly: true },
    name: { type: "string", xml: "Name", yaml: "Имя" },
    value: { type: "string", xml: "Value", yaml: "Значение" },
    path: { type: "TestDeferred" as PropertyRuleType, xml: "Path", yaml: "Путь" },
  },
} as MetadataItemRule

beforeAll(() => {
registerTypeRule("TestDeferred" as PropertyRuleType, "finalizeImportedYAML", ({ value }) => value)
registerMetadataItemCollectionRule({
  propertyType: "TestRecordCollection" as PropertyRuleType,
  itemRule,
  xmlElement: "Item",
  keyField: "name",
  classifyYamlKey: ({ yamlKey }) => /^[$_\p{L}][$_\p{L}\p{N}]*$/u.test(yamlKey) ? "valid" : "invalid",
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
})

describe("importMetadataItemCollectionFromXMLToYAML", () => {
  it("помечает первый и следующий элементы с невалидным повторным именем", () => {
    const annotations = createXmlAnomalyAnnotations()
    const { yaml } = importTestRecordCollection(
      "<Root><Items>" +
      "<Item><Name>1Код</Name><Value>first</Value></Item>" +
      "<Item><Name>1Код</Name><Value>second</Value></Item>" +
      "</Items></Root>",
      annotations,
    )

    expect(serializeYAMLDocument(yaml, annotations).text).toContain(
      "Элементы:\n  !xml/invalid 1Код:\n    Значение: first\n  !xml/invalid/2 1Код:\n    Значение: second",
    )
  })

  it("не схлопывает повторный ключ при отсутствии таблицы аннотаций", () => {
    expect(() => importTestRecordCollection(
      "<Root><Items>" +
      "<Item><Name>Код</Name><Value>first</Value></Item>" +
      "<Item><Name>Код</Name><Value>second</Value></Item>" +
      "</Items></Root>",
      undefined,
      false,
    )).toThrow(/таблиц.*аннотац/i)
  })

  it("сохраняет все элементы record-коллекции с повторным логическим ключом", () => {
    const annotations = createXmlAnomalyAnnotations()
    const { yaml, audit } = importTestRecordCollection(
      "<Root><Items>" +
      "<Item><Name>Код</Name><Value>first</Value></Item>" +
      "<Item><Name>Код</Name><Value>second</Value></Item>" +
      "<Item><Name>Код</Name><Value>third</Value></Item>" +
      "</Items></Root>",
      annotations,
    )
    const items = yaml.Элементы as Record<string, unknown>

    expect(xmlAnnotatedMappingEntries(items, annotations)).toEqual([
      ["Код", { Значение: "first" }],
      ["Код", { Значение: "second" }],
      ["Код", { Значение: "third" }],
    ])
    expect(serializeYAMLDocument(yaml, annotations).text).toContain(
      "!xml/invalid/2 Код:",
    )
  })

  it("передаёт collection все одноимённые Item в исходном порядке", () => {
    const collector = createLocalIndexesCollector()
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
    const root = parseXmlDocumentWithSaxes(
      "<Root><Item><Name>Первый</Name><Value>a</Value></Item>" +
      "<Item><Name>Второй</Name><Value>b</Value></Item></Root>",
    ).roots[0]!
    const audit = createXmlImportAuditSession([root])

    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "TestRepeatedCollectionOwner",
        properties: {
          items: { type: "TestArrayCollection", xml: "Item", yaml: "Элементы" },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: root }],
      yamlPath: [],
      rulePath: [],
      collector,
      audit,
    })
    audit.finalize()

    expect(yaml).toEqual({
      Элементы: [
        { Имя: "Первый", Значение: "a" },
        { Имя: "Второй", Значение: "b" },
      ],
    })
    expect(
      audit.outcomes()
        .filter(({ node }) => "type" in node && node.type === "element" && node.name === "Item")
        .map(({ state }) => state),
    ).toEqual(["claimed", "claimed"])
  })

  it("локализует сбой nested PropertyRule и откатывает три буферных collector", () => {
    const failedType = "TestNestedBufferedFailure" as PropertyRuleType
    const collectionType = "TestNestedBufferedCollection" as PropertyRuleType
    registerTypeRule(failedType, "importFromXMLToYAML", ({ traversal }) => {
      traversal.deferred?.accept({ valuePath: traversal.yamlPath, rulePath: traversal.rulePath })
      traversal.dependent?.accept({
        itemType: "TestNestedBufferedItem",
        itemYamlPath: ["Элементы", "Первый"],
        propertyKey: "broken",
        yamlPath: traversal.yamlPath,
        xmlValue: "broken",
        presentInXML: true,
      })
      return "leaked"
    })
    registerTypeRule(failedType, "collectLocalFactsFromYAML", ({ writer }) => {
      writer.setOwnerFact("nested-failed", "leaked")
      throw new Error("broken nested facts")
    })
    registerMetadataItemCollectionRule({
      propertyType: collectionType,
      itemRule: {
        itemType: "TestNestedBufferedItem",
        properties: {
          name: { type: "string", xml: "Name", yaml: "Имя" },
          broken: { type: failedType, xml: "Broken", yaml: "Сломано" },
          good: { type: "string", xml: "Good", yaml: "Хорошее" },
        },
      } as MetadataItemRule,
      xmlElement: "Item",
      keyField: "name",
      recordYamlKeyFromYAML: ({ name }) => name,
    })
    const collector = createLocalIndexesCollector()
    const deferred = createDeferredValuePathCollector()
    const dependent = createImportedDependentPropertyCollector()
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
    const root = parseXmlDocumentWithSaxes(
      "<Root><Items><Item><Name>Первый</Name><Broken>x</Broken>" +
      "<Good>ok</Good></Item></Items></Root>",
    ).roots[0]!
    const audit = createXmlImportAuditSession([root])

    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "TestNestedBufferedOwner",
        properties: {
          items: { type: collectionType, xml: "Items", yaml: "Элементы" },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: root }],
      yamlPath: [],
      rulePath: [],
      collector,
      deferred,
      dependent,
      audit,
    })

    expect(yaml).toEqual({ Элементы: { Первый: { Хорошее: "ok" } } })
    expect(
      collector.finish().metadata.events.filter(
        (event) => event.kind === "property" && event.propertyType === failedType,
      ),
    ).toEqual([])
    expect(deferred.finish()).toEqual([])
    expect(dependent.finish()).toEqual([])
    expect(audit.rawCandidates()).toMatchObject([
      {
        node: { path: "/Root[1]/Items[1]/Item[1]/Broken[1]" },
        boundary: {
          itemType: "TestNestedBufferedItem",
          propertyKey: "broken",
          propertyType: failedType,
          yamlPath: ["Элементы", "Первый", "Сломано"],
          rulePath: [
            { propertyKey: "items", nestedItemType: "TestNestedBufferedItem" },
            { propertyKey: "broken" },
          ],
        },
      },
    ])
  })

  it.each(xmlImportAttemptPhases)("пробрасывает фазу %s через nested metadata-collection без raw", (phase) => {
    const valueType = `TestNestedCollectionInfrastructureValue${phase}` as PropertyRuleType
    const collectionType = `TestNestedCollectionInfrastructure${phase}` as PropertyRuleType
    if (phase === "rollback") {
      registerTypeRule(valueType, "importFromXMLToYAML", () => {
        throw new Error("nested collection conversion failed")
      })
    }
    registerMetadataItemCollectionRule({
      propertyType: collectionType,
      itemRule: {
        itemType: `TestNestedCollectionInfrastructureItem${phase}`,
        properties: {
          value: {
            type: phase === "rollback" ? valueType : "string",
            xml: "Value",
            yaml: "Значение",
          },
        },
      } as MetadataItemRule,
      xmlElement: "Item",
      yamlAsArray: true,
    })
    const { collector, cause } = createFailingXmlImportAttempt({
      phase,
      causeMessage: `${phase} nested collection infrastructure failed`,
      targetAttempt: 2,
    })
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
    const root = parseXmlDocumentWithSaxes(
      "<Root><Item><Value>value</Value></Item></Root>",
    ).roots[0]!
    const audit = createXmlImportAuditSession([root])

    const thrown = captureTestXmlImport({
      context,
      xml: root,
      rule: {
        itemType: `TestNestedCollectionInfrastructureOwner${phase}`,
        properties: {
          items: { type: collectionType, xml: "Item", yaml: "Элементы" },
        },
      } as MetadataItemRule,
      collector,
      audit,
    })

    expectXmlImportInfrastructureFailure({ thrown, phase, cause, audit })
  })

  it("публикует готовые local facts с финальным YAML-ключом один раз", () => {
    const valueType = "TestBufferedLocalFact" as PropertyRuleType
    const collectionType = "TestRekeyedBufferedCollection" as PropertyRuleType
    let localFactCalls = 0
    registerTypeRule(valueType, "importFromXMLToYAML", ({ xml }) => xml)
    registerTypeRule(valueType, "collectLocalFactsFromYAML", ({ fact, writer }) => {
      localFactCalls += 1
      writer.setOwnerFact("buffered", fact.value)
    })
    registerMetadataItemCollectionRule({
      propertyType: collectionType,
      itemRule: {
        itemType: "TestRekeyedBufferedItem",
        properties: {
          name: { type: "string", xml: "Name", yaml: "Имя" },
          value: { type: valueType, xml: "Value", yaml: "Значение" },
        },
      } as MetadataItemRule,
      xmlElement: "Item",
      keyField: "name",
      recordYamlKeyFromYAML: () => "Финальный",
    })
    const collector = createLocalIndexesCollector()
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "TestRekeyedBufferedOwner",
        properties: {
          items: { type: collectionType, xml: "Items", yaml: "Элементы" },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: { Items: { Item: { Name: "Исходный", Value: "ok" } } } }],
      yamlPath: [],
      rulePath: [],
      collector,
    })

    expect(yaml).toEqual({ Элементы: { Финальный: { Значение: "ok" } } })
    expect(localFactCalls).toBe(1)
    const metadata = collector.finish().metadata
    expect(metadata.events.filter(({ yamlPath }) => yamlPath.length === 3)).toMatchObject([
      { kind: "property", yamlPath: ["Элементы", "Финальный", "Имя"] },
      { kind: "property", yamlPath: ["Элементы", "Финальный", "Значение"] },
    ])
    expect(metadata.ownerFacts).toEqual({ buffered: "ok" })
  })

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
          uuid: "11111111-1111-1111-1111-111111111111",
        }),
        expect.objectContaining({
          logicalAddress: "Владелец.A.Элемент.Второй",
          uuid: "22222222-2222-2222-2222-222222222222",
        }),
      ])
    )
    expect(arrayCollector.fragment("test.yaml").entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logicalAddress: "Владелец.A.Элементы[0]",
          uuid: "11111111-1111-1111-1111-111111111111",
        }),
        expect.objectContaining({
          logicalAddress: "Владелец.A.Элементы[1]",
          uuid: "22222222-2222-2222-2222-222222222222",
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
      uuid: "11111111-1111-1111-1111-111111111111",
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

function importTestRecordCollection(
  xml: string,
  annotations?: ReturnType<typeof createXmlAnomalyAnnotations>,
  withAudit = true,
): {
  yaml: Record<string, unknown>
  audit: ReturnType<typeof createXmlImportAuditSession>
} {
  const collector = createLocalIndexesCollector()
  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
  const root = parseXmlDocumentWithSaxes(xml).roots[0]!
  const audit = createXmlImportAuditSession([root])
  const yaml = importPropertiesFromXMLToYAML({
    context,
    rule: {
      itemType: "TestRecordCollectionOwner",
      properties: {
        items: { type: "TestRecordCollection", xml: "Items", yaml: "Элементы" },
      },
    } as MetadataItemRule,
    sources: [{ context, xml: root }],
    yamlPath: [],
    rulePath: [],
    collector,
    ...(withAudit ? { audit } : {}),
    annotations,
  })!
  return { yaml, audit }
}

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
