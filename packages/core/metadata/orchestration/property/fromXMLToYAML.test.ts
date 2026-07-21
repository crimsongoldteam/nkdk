import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { createLocalIndexesCollector } from "../../project/localIndexes"
import { importPropertiesFromXMLToYAML } from "./fromXMLToYAML"
import { PropertyRuleType } from "./registry"
import { registerTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule } from "./types"

describe("importPropertiesFromXMLToYAML", () => {
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
        referenceOnly: { type: "TestReferenceDirect", xml: "ReferenceOnly", yaml: "ТолькоСсылка", forReferenceOnly: true },
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
        xml: { Text: "Сообщить(\"ok\")" },
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      })
    ).toEqual({})
    expect(externalFilesCollector).toEqual([
      { relativePath: "Модули/Владелец.bsl", content: "Сообщить(\"ok\")" },
    ])
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
      xml: { Caption: "Заголовок", ExplicitDefault: "Авто" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexCollector.fragment("test.yaml").xmlNodes).toEqual([
      {
        logicalAddress: "Справочник.Товары",
        order: ["title", "explicitDefault"],
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
          properties: { value: { type: "TestBrokenDirect", xml: "Value", yaml: "Значение" } },
        } as MetadataItemRule,
        xml: { Value: "x" },
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
      })
      expect((error as Error).cause).toMatchObject({ message: "broken" })
    }
  })
})

function runSingleProperty(property: Record<string, unknown>, xml: Record<string, unknown>): Record<string, unknown> | undefined {
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
