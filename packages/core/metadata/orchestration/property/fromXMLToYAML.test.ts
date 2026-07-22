import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { importPropertiesFromXMLToYAML as importPropertiesWithSources } from "./fromXMLToYAML"
import { PropertyRuleType } from "./registry"
import { registerTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule } from "./types"

describe("importPropertiesFromXMLToYAML", () => {
  it("sorts only properties produced by the current rules", () => {
    registerTypeRule("TestUnsortedArray" as PropertyRuleType, "importFromXMLToYAML", ({ xml }) => xml)
    const nested = [{ Бета: 1, Альфа: 2 }]

    const yaml = importPropertiesWithSources({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      rule: {
        itemType: "TestOrderedYamlItem",
        properties: {
          beta: { type: "string", xml: "Beta", yaml: "Бета" },
          valueType: { type: "string", xml: "ValueType", yaml: "Тип" },
          synonym: { type: "string", xml: "Synonym", yaml: "Синоним" },
          kind: { type: "string", xml: "Kind", yaml: "Вид" },
          title: { type: "string", xml: "Title", yaml: "Заголовок" },
          alpha: { type: "string", xml: "Alpha", yaml: "Альфа" },
          items: { type: "TestUnsortedArray", xml: "Items", yaml: "Элементы" },
        },
      } as MetadataItemRule,
      sources: [
        {
          context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
          xml: {
            Beta: "beta",
            ValueType: "type",
            Synonym: "synonym",
            Kind: "kind",
            Title: "title",
            Alpha: "alpha",
            Items: nested,
          },
        },
      ],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })!

    expect(Object.keys(yaml)).toEqual(["Заголовок", "Синоним", "Вид", "Тип", "Альфа", "Бета", "Элементы"])
    expect(Object.keys((yaml.Элементы as object[])[0]!)).toEqual(["Бета", "Альфа"])
  })

  it("does not process an absent property without defaultValue", () => {
    const calls: string[] = []
    registerTypeRule("TestPresentOnly" as PropertyRuleType, "importFromXML", (_context, _rule, xml) => {
      calls.push(String(xml))
      return xml
    })
    registerTypeRule("TestPresentOnly" as PropertyRuleType, "exportToYAML", (_context, _rule, value) => value)
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

    const yaml = importPropertiesWithSources({
      context,
      rule: {
        itemType: "TestPresentOnlyItem",
        properties: {
          present: { type: "TestPresentOnly", xml: "Present", yaml: "Присутствует" },
          absent: { type: "TestPresentOnly", xml: "Absent", yaml: "Отсутствует" },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: { Present: "value" } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({ Присутствует: "value" })
    expect(calls).toEqual(["value"])
  })

  it("processes only an absent property with defaultValue", () => {
    const calls: unknown[] = []
    registerTypeRule("TestMissingDefault" as PropertyRuleType, "importFromXML", (_context, _rule, xml) => {
      calls.push(xml)
      return xml
    })
    registerTypeRule("TestMissingDefault" as PropertyRuleType, "exportToYAML", (_context, _rule, value) => value)
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

    const yaml = importPropertiesWithSources({
      context,
      rule: {
        itemType: "TestMissingDefaultItem",
        properties: {
          absent: { type: "TestMissingDefault", xml: "Absent", yaml: "Значение", defaultValue: "default" },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: {} }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({ Значение: "default" })
    expect(calls).toEqual([undefined])
  })

  it("imports tagged properties from two XML sources in one rule traversal", () => {
    const calls: string[] = []
    registerTypeRule("TestTaggedAtomic" as PropertyRuleType, "importFromXML", (_context, rule, xml) => {
      calls.push(`${rule.tag}:${xml}`)
      return xml
    })
    registerTypeRule("TestTaggedAtomic" as PropertyRuleType, "exportToYAML", (_context, _rule, value) => value)
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "TestDirectItem",
        properties: {
          body: { type: "TestTaggedAtomic", xml: "Body", yaml: "Тело", tag: "Body" },
          metadata: { type: "TestTaggedAtomic", xml: "Metadata", yaml: "Метаданные", tag: "Metadata" },
        },
      } as MetadataItemRule,
      sources: [
        { context, xml: { Body: "body" }, tags: ["Body"] },
        { context, xml: { Metadata: "metadata" }, tags: ["Metadata"] },
      ],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({ Тело: "body", Метаданные: "metadata" })
    expect(calls).toEqual(["Body:body", "Metadata:metadata"])
  })

  it("imports a nested item from registered XML sources", () => {
    const propertyType = "TestNestedSources" as PropertyRuleType
    const nestedRule = {
      itemType: "TestNestedSourceItem",
      properties: {
        value: { type: "string", xml: "Value", yaml: "Значение" },
      },
    } as MetadataItemRule
    registerTypeRule(propertyType, "nestedItemRule", { itemRule: nestedRule })
    registerTypeRule(propertyType, "resolveNestedImportXMLSources", ({ context, xml }) => [
      { context, xml: (xml as { Root: Record<string, unknown> }).Root },
    ])
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

    const yaml = importPropertiesWithSources({
      context,
      rule: {
        itemType: "TestDirectItem",
        properties: {
          nested: { type: propertyType, xml: "Nested", yaml: "Вложенный" },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: { Nested: { Root: { Value: "value" } } } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({ Вложенный: { Значение: "value" } })
  })

  it("immediately converts one atomic XML value to YAML", () => {
    const calls: string[] = []
    registerTypeRule("TestDirectAtomic" as PropertyRuleType, "importFromXML", (_context, _rule, xml) => {
      calls.push("fromXML")
      return { parsed: String(xml) }
    })
    registerTypeRule("TestDirectAtomic" as PropertyRuleType, "exportToYAML", (_context, _rule, value) => {
      calls.push("toYAML")
      return (value as { parsed: string }).parsed.toUpperCase()
    })
    const collector = createLocalIndexesCollector()

    const yaml = importPropertiesFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      rule: {
        itemType: "TestDirectItem",
        properties: {
          value: { type: "TestDirectAtomic", xml: "Value", yaml: "Значение" },
        },
      } as MetadataItemRule,
      xml: { Value: "abc" },
      yamlPath: [],
      rulePath: [],
      collector,
    })

    expect(calls).toEqual(["fromXML", "toYAML"])
    expect(yaml).toEqual({ Значение: "ABC" })
    expect(yaml).not.toHaveProperty("value")
    expect(collector.finish()).toEqual({ metadata: expect.anything(), dependencies: [] })
  })

  it("uses a direct handler instead of rebuilding a legacy value", () => {
    registerTypeRule("TestDirectOnly" as PropertyRuleType, "importFromXML", () => {
      throw new Error("legacy import must not run")
    })
    registerTypeRule("TestDirectOnly" as PropertyRuleType, "importFromXMLToYAML", ({ xml }) => `direct:${xml}`)

    expect(
      importPropertiesFromXMLToYAML({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule: {
          itemType: "TestDirectItem",
          properties: { value: { type: "TestDirectOnly", xml: "Value", yaml: "Значение" } },
        } as MetadataItemRule,
        xml: { Value: "x" },
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      })
    ).toEqual({ Значение: "direct:x" })
  })

  it("omits an empty direct value", () => {
    registerTypeRule("TestDirectEmptyCollection" as PropertyRuleType, "importFromXMLToYAML", () => [])

    expect(
      importPropertiesFromXMLToYAML({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule: {
          itemType: "TestDirectItem",
          properties: {
            empty: { type: "TestDirectEmptyCollection", xml: "Empty", yaml: "Пусто" },
          },
        } as MetadataItemRule,
        xml: { Empty: {} },
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      })
    ).toEqual({})
  })

  it("collects imported XML-prefix values for the configuration index", () => {
    registerTypeRule("TestIndexedImport" as PropertyRuleType, "importFromXML", () => ({ xmlPrefix: "v8" }))
    registerTypeRule("TestIndexedImport" as PropertyRuleType, "exportToYAML", () => "Type")
    const indexCollector = createConfigurationIndexCollector()

    importPropertiesFromXMLToYAML({
      context: withConfigurationIndexCollector(
        { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        indexCollector,
        "Сервис.Тип"
      ),
      rule: {
        itemType: "TestDirectItem",
        properties: { type: { type: "TestIndexedImport", xml: "Type", yaml: "Тип" } },
      } as MetadataItemRule,
      xml: { Type: "v8:Type" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexCollector.fragment("test.yaml").xmlValues).toEqual([
      { logicalAddress: "Сервис.Тип.type", xmlPrefix: "v8" },
    ])
  })

  it("keeps direct conversion inside the property index context and collects its XML prefix", () => {
    const indexContexts: string[] = []
    registerTypeRule("TestDirectIndexed" as PropertyRuleType, "importFromXMLToYAML", ({ context }) => {
      indexContexts.push(context.fromXML.configurationIndex?.xmlNodeLogicalAddress ?? "")
      return { xmlPrefix: "v8" }
    })
    const indexCollector = createConfigurationIndexCollector()

    importPropertiesFromXMLToYAML({
      context: withConfigurationIndexCollector(
        { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        indexCollector,
        "Сервис.Тип"
      ),
      rule: {
        itemType: "TestDirectItem",
        properties: { type: { type: "TestDirectIndexed", xml: "Type", yaml: "Тип" } },
      } as MetadataItemRule,
      xml: { Type: "v8:Type" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexContexts).toEqual(["Сервис.Тип.Свойство.Тип"])
    expect(indexCollector.fragment("test.yaml").xmlValues).toEqual([
      { logicalAddress: "Сервис.Тип.type", xmlPrefix: "v8" },
    ])
  })

  it("matches reference-mode import selection", () => {
    registerTypeRule("TestReferenceDirect" as PropertyRuleType, "importFromXMLToYAML", ({ xml }) => String(xml))
    const rule = {
      itemType: "TestDirectItem",
      properties: {
        referenceOnly: {
          type: "TestReferenceDirect",
          xml: "ReferenceOnly",
          yaml: "ТолькоСсылка",
          forReferenceOnly: true,
        },
        disabled: { type: "TestReferenceDirect", xml: "Disabled", yaml: "Выключено", fromXML: false },
      },
    } as MetadataItemRule
    const xml = { ReferenceOnly: "one", Disabled: "two" }

    expect(
      importPropertiesFromXMLToYAML({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule,
        xml,
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      })
    ).toEqual({})
    expect(
      importPropertiesFromXMLToYAML({
        context: { ...mockContextFromXML({ forReference: true }), exportToYAML: { toTyped: true } },
        rule,
        xml,
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      })
    ).toEqual({ ТолькоСсылка: "one", Выключено: "two" })
  })

  it.each([
    ["alias", { Alias: "x" }, { xml: "Value", xmlAliases: ["Alias"], yaml: "Значение" }, "x"],
    ["parent", { Properties: { Value: "x" } }, { xml: "Value", xmlParents: ["Properties"], yaml: "Значение" }, "x"],
    ["model default", {}, { xml: "Value", yaml: "Значение", defaultValue: "x" }, "x"],
    ["empty default", { Value: "" }, { xml: "Value", yaml: "Значение", defaultValueXMLEmpty: "x" }, ""],
  ])("preserves %s XML selection", (_name, xml, property, expected) => {
    expect(runSingleProperty(property, xml)).toEqual({ Значение: expected })
  })

  it.each([
    ["fromXML", { fromXML: false }],
    ["toYAML", { toYAML: false }],
    ["implicit YAML", { type: "boolean", implicitValueYAML: true }],
  ])("omits a property disabled by %s", (_name, options) => {
    expect(runSingleProperty({ xml: "Value", yaml: "Значение", ...options }, { Value: true })).toEqual({})
  })

  it("writes external-file content without retaining it in YAML", () => {
    const externalFilesCollector: Array<{ relativePath: string; content: string }> = []

    expect(
      importPropertiesFromXMLToYAML({
        context: {
          ...mockContextFromXML(),
          exportToYAML: { toTyped: true, parent: { name: "Владелец" }, externalFilesCollector },
        },
        rule: {
          itemType: "TestDirectItem",
          properties: {
            text: {
              type: "string",
              xml: "Text",
              yaml: "Текст",
              externalFile: { dir: "Модули", extension: "bsl", nameFrom: "parent" },
            },
          },
        } as MetadataItemRule,
        xml: { Text: 'Сообщить("ok")' },
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      })
    ).toEqual({})
    expect(externalFilesCollector).toEqual([{ relativePath: "Модули/Владелец.bsl", content: 'Сообщить("ok")' }])
  })

  it("writes an external file when the property has no YAML key", () => {
    const externalFilesCollector: Array<{ relativePath: string; content: string }> = []

    expect(
      importPropertiesFromXMLToYAML({
        context: {
          ...mockContextFromXML(),
          exportToYAML: { toTyped: true, parent: { name: "Владелец" }, externalFilesCollector },
        },
        rule: {
          itemType: "TestDirectItem",
          properties: {
            queryText: {
              type: "string",
              xml: "QueryText",
              externalFile: { dir: "Запросы", extension: "txt", nameFrom: "parent" },
            },
          },
        } as MetadataItemRule,
        xml: { QueryText: "ВЫБРАТЬ 1" },
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      })
    ).toEqual({})
    expect(externalFilesCollector).toEqual([{ relativePath: "Запросы/Владелец.txt", content: "ВЫБРАТЬ 1" }])
  })

  it("preserves configuration-index aliases, order and significant presence", () => {
    const indexCollector = createConfigurationIndexCollector()

    importPropertiesFromXMLToYAML({
      context: withConfigurationIndexCollector(
        { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        indexCollector,
        "Справочник.Товары"
      ),
      rule: {
        itemType: "TestDirectItem",
        properties: {
          title: { type: "string", xml: "Title", xmlAliases: ["Caption"], yaml: "Заголовок" },
          explicitDefault: {
            type: "string",
            xml: "ExplicitDefault",
            yaml: "ЯвноеПоУмолчанию",
            defaultValueXML: "Авто",
            preserveExplicitDefaultXML: true,
          },
        },
      } as MetadataItemRule,
      xml: { ExplicitDefault: "Авто", Caption: "Заголовок" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexCollector.fragment("test.yaml").xmlNodes).toEqual([
      {
        logicalAddress: "Справочник.Товары",
        order: ["explicitDefault", "title"],
        aliases: { title: "Caption" },
        present: ["explicitDefault"],
      },
    ])
  })

  it("adds exact coordinates when a direct conversion fails", () => {
    registerTypeRule("TestBrokenDirect" as PropertyRuleType, "importFromXMLToYAML", () => {
      throw new Error("broken")
    })

    try {
      importPropertiesFromXMLToYAML({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule: {
          itemType: "TestDirectItem",
          properties: {
            value: {
              type: "TestBrokenDirect",
              xml: "Value",
              xmlParents: ["Attributes"],
              yaml: "Значение",
            },
          },
        } as MetadataItemRule,
        xml: { Attributes: { Value: "x" } },
        yamlPath: ["Вложенный"],
        rulePath: [{ propertyKey: "child", nestedItemType: "TestChild" }],
        collector: createLocalIndexesCollector(),
      })
      expect.unreachable("expected direct conversion to fail")
    } catch (error) {
      expect(error).toMatchObject({
        name: "DirectImportConversionError",
        yamlPath: ["Вложенный", "Значение"],
        rulePath: [{ propertyKey: "child", nestedItemType: "TestChild" }, { propertyKey: "value" }],
        xmlPath: ["Attributes", "Value"],
      })
      expect((error as Error).message).toContain("xmlPath=/Attributes/Value")
      expect((error as Error).cause).toMatchObject({ message: "broken" })
    }
  })
})

function runSingleProperty(
  property: Record<string, unknown>,
  xml: Record<string, unknown>
): Record<string, unknown> | undefined {
  return importPropertiesFromXMLToYAML({
    context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
    rule: {
      itemType: "TestDirectItem",
      properties: { value: { type: "string", ...property } },
    } as MetadataItemRule,
    xml,
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
  })
}

type DirectImportParams = Parameters<typeof importPropertiesWithSources>[0]
type SingleSourceImportParams = Omit<DirectImportParams, "sources"> & { xml: Record<string, unknown> }

function importPropertiesFromXMLToYAML(params: DirectImportParams | SingleSourceImportParams) {
  if ("sources" in params) return importPropertiesWithSources(params)
  const { xml, ...rest } = params
  return importPropertiesWithSources({ ...rest, sources: [{ context: params.context, xml }] })
}
