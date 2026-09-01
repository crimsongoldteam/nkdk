import {
createConfigurationIndexCollector,
createXmlImportAuditSession,
parseXmlDocumentWithSaxes,
runWithConfigurationIndexPropertyContext,
withConfigurationIndexCollector,
withConfigurationIndexLogicalAddress
} from "@nkdk/runtime"
import { describe,expect,it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import {
captureTestXmlImport,
createFailingXmlImportAttempt,
expectXmlImportInfrastructureFailure,
xmlImportAttemptPhases,
} from "../../../tests/xmlImportAttempt"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { importPropertiesFromXMLToYAML as importPropertiesWithSources } from "./fromXMLToYAML"
import {
createDirectImportProfile,
createDeferredValuePathCollector,
createImportedDependentPropertyCollector,
} from "./importYamlTypes"
import { PropertyRuleType } from "./registry"
import { registerTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule } from "./types"
import { MetadataCommonModuleRules } from "../../appliedObjects/metadataCommonModule/rules"
import { MetadataCommonAttributeRules } from "../../appliedObjects/metadataCommonAttribute/rules"
import { MetadataDocumentRules } from "../../appliedObjects/metadataDocument/rules"
import { MetadataDocumentNumeratorRules } from "../../appliedObjects/metadataDocumentNumerator/rules"
import { MetadataTaskRules } from "../../appliedObjects/metadataTask/rules"
import { MetadataExternalDataSourceTableRules } from "../../commonObjects/metadataExternalDataSourceTable/rules"

describe("importPropertiesFromXMLToYAML", () => {

  it("считает полное и собственное время XML → YAML по типу свойства", () => {
    const { profile, yaml } = importProfiledBoolean(true)

    expect(yaml).toEqual({ Значение: "Истина" })
    expect(profile.propertyTypeProfiles.boolean).toMatchObject({ propertyCount: 1 })
    expect(profile.propertyTypeProfiles.boolean!.inclusiveMs).toBeGreaterThanOrEqual(
      profile.propertyTypeProfiles.boolean!.exclusiveMs,
    )
  })

  it("не создаёт профиль типов свойств в выключенном режиме", () => {
    const { profile } = importProfiledBoolean(false)

    expect(profile.propertyTypeProfiles).toEqual({})
  })

  it.each([
    [MetadataCommonAttributeRules, "DataSeparation", "DontUse"],
    [MetadataCommonModuleRules, "ReturnValuesReuse", "DontUse"],
    [MetadataDocumentRules, "CheckUnique", true],
    [MetadataDocumentRules, "NumberPeriodicity", "Nonperiodical"],
    [MetadataDocumentNumeratorRules, "CheckUnique", true],
    [MetadataDocumentNumeratorRules, "NumberPeriodicity", "Nonperiodical"],
    [MetadataTaskRules, "CheckUnique", true],
    [MetadataExternalDataSourceTableRules, "TableType", "Table"],
    [MetadataExternalDataSourceTableRules, "ReadOnly", false],
  ] as const)("опускает XML-default обычного объекта %s.%s", (rule, xmlName, xmlValue) => {
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

    const yaml = importPropertiesWithSources({
      context,
      rule,
      sources: [{ context, xml: { Properties: { [xmlName]: xmlValue } } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({})
  })

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

  it("uses registered explicit empty value only for a present XML property", () => {
    registerTypeRule("TestExplicitEmpty" as PropertyRuleType, "importFromXML", () => undefined)
    registerTypeRule("TestExplicitEmpty" as PropertyRuleType, "exportToYAML", (_context, _rule, value) => value)
    registerTypeRule("TestExplicitEmpty" as PropertyRuleType, "xmlImportPropertyBehavior", {
      explicitEmptyValue: () => "Явно пусто",
    })
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
    const rule = {
      itemType: "TestExplicitEmptyItem",
      properties: {
        value: { type: "TestExplicitEmpty", xml: "Value", yaml: "Значение" },
      },
    } as MetadataItemRule

    const present = importPropertiesWithSources({
      context,
      rule,
      sources: [{ context, xml: { Value: "" } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })
    const absent = importPropertiesWithSources({
      context,
      rule,
      sources: [{ context, xml: {} }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(present).toEqual({ Значение: "Явно пусто" })
    expect(absent).toEqual({})
  })

  it("passes a present semantic explicit-empty value to a direct converter as an empty string", () => {
    const received: unknown[] = []
    registerTypeRule("TestDirectExplicitEmpty" as PropertyRuleType, "importFromXMLToYAML", ({ xml }) => {
      received.push(xml)
      return xml
    })
    registerTypeRule("TestDirectExplicitEmpty" as PropertyRuleType, "xmlImportPropertyBehavior", {
      explicitEmptyValue: () => ({ semantic: true }),
    })
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

    const yaml = importPropertiesWithSources({
      context,
      rule: {
        itemType: "TestDirectExplicitEmptyItem",
        properties: {
          value: { type: "TestDirectExplicitEmpty", xml: "Value", yaml: "Значение" },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: { Value: undefined } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(received).toEqual([""])
    expect(yaml).toEqual({ Значение: "" })
  })

  it("preserves an explicit null returned by an XML importer", () => {
    registerTypeRule("TestExplicitNull" as PropertyRuleType, "importFromXML", () => null)
    registerTypeRule("TestExplicitNull" as PropertyRuleType, "exportToYAML", (_context, _rule, value) => value)
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

    const yaml = importPropertiesWithSources({
      context,
      rule: {
        itemType: "TestExplicitNullItem",
        properties: {
          value: { type: "TestExplicitNull", xml: "Value", yaml: "Значение" },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: { Value: { "_xsi:nil": true } } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({ Значение: null })
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

  it("не записывает present для свойств из частичных источников", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Справочник.Товары")

    const yaml = importPropertiesWithSources({
      context,
      rule: {
        itemType: "TestDirectItem",
        properties: {
          first: { type: "string", xml: "First", yaml: "Первое", tag: "main" },
          second: { type: "string", xml: "Second", yaml: "Второе", tag: "additional" },
          third: { type: "string", xml: "Third", yaml: "Третье", tag: "main" },
        },
      } as MetadataItemRule,
      sources: [
        { context, xml: { First: "1", Third: "3" }, tags: ["main"] },
        { context, xml: { Second: "2" }, tags: ["additional"] },
      ],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({ Первое: "1", Второе: "2", Третье: "3" })
    expect(indexCollector.fragment("test.yaml").entities).toEqual([])
  })

  it("не связывает разные сборщики через общее наблюдение present", () => {
    const firstContext = withConfigurationIndexCollector(
      mockContextFromXML(),
      createConfigurationIndexCollector(),
      "Справочник.Товары"
    )
    const secondContext = withConfigurationIndexCollector(
      mockContextFromXML(),
      createConfigurationIndexCollector(),
      "Справочник.Товары"
    )

    expect(
      importPropertiesWithSources({
        context: firstContext,
        rule: {
          itemType: "TestDirectItem",
          properties: {
            first: { type: "string", xml: "First", yaml: "Первое", tag: "main" },
            second: { type: "string", xml: "Second", yaml: "Второе", tag: "additional" },
          },
        } as MetadataItemRule,
        sources: [
          { context: firstContext, xml: { First: "1" }, tags: ["main"] },
          { context: secondContext, xml: { Second: "2" }, tags: ["additional"] },
        ],
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      })
    ).toEqual({ Первое: "1", Второе: "2" })
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
    expect(collector.finish()).toEqual({ metadata: expect.anything() })
  })

  it("filters imported YAML finalization through the optional type predicate", () => {
    const alwaysType = "TestFinalizeAlways" as PropertyRuleType
    const filteredType = "TestFinalizeFiltered" as PropertyRuleType
    const predicateOnlyType = "TestPredicateWithoutFinalizer" as PropertyRuleType
    registerTypeRule(alwaysType, "finalizeImportedYAML", ({ value }) => value)
    registerTypeRule(filteredType, "finalizeImportedYAML", ({ value }) => value)
    registerTypeRule(filteredType, "requiresImportedYAMLFinalization", ({ value }) => value === "defer")
    registerTypeRule(predicateOnlyType, "requiresImportedYAMLFinalization", () => true)

    const deferred = createDeferredValuePathCollector()
    importPropertiesFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      rule: {
        itemType: "TestFinalizationFilter",
        properties: {
          always: { type: alwaysType, xml: "Always", yaml: "Всегда" },
          skipped: { type: filteredType, xml: "Skipped", yaml: "Пропущено" },
          selected: { type: filteredType, xml: "Selected", yaml: "Отложено" },
          predicateOnly: { type: predicateOnlyType, xml: "PredicateOnly", yaml: "БезФинализатора" },
        },
      } as MetadataItemRule,
      xml: { Always: "value", Skipped: "ready", Selected: "defer", PredicateOnly: "value" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
      deferred,
    })

    expect(deferred.finish().map(({ valuePath }) => valuePath)).toEqual([["Всегда"], ["Отложено"]])
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

  it("does not apply a semantic default to an omitted direct YAML value", () => {
    registerTypeRule("TestDirectOmittedDefault" as PropertyRuleType, "importFromXMLToYAML", () => undefined)

    expect(
      importPropertiesFromXMLToYAML({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule: {
          itemType: "TestDirectItem",
          properties: {
            value: {
              type: "TestDirectOmittedDefault",
              xml: "Value",
              yaml: "Значение",
              defaultValue: { items: { ru: "Смысловой default" } },
            },
          },
        } as MetadataItemRule,
        xml: { Value: {} },
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      }),
    ).toEqual({})
  })

  it("restores an explicit empty inline collection after direct conversion", () => {
    registerTypeRule("TestDirectInlineEmptyCollection" as PropertyRuleType, "importFromXMLToYAML", () => undefined)

    expect(
      importPropertiesFromXMLToYAML({
        context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
        rule: {
          itemType: "TestDirectItem",
          properties: {
            items: {
              type: "TestDirectInlineEmptyCollection",
              xml: "Item",
              yaml: "items",
              yamlInline: true,
              defaultValue: [],
              defaultValueXMLEmpty: [],
            },
          },
        } as MetadataItemRule,
        xml: {},
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      }),
    ).toEqual({ items: [] })
  })

  it("does not collect imported XML-prefix values for the configuration index", () => {
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

    expect(indexCollector.fragment("test.yaml").entities).toEqual([])
  })

  it("keeps direct conversion inside the property index context without collecting its XML prefix", () => {
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
    expect(indexCollector.fragment("test.yaml").entities).toEqual([])
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

  it("collects configuration-index data before skipping a reference-only property", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Справочник.Товары")

    registerTypeRule(
      "TestReferenceIndex" as PropertyRuleType,
      "collectConfigurationIndexFromXML",
      ({ context: propertyContext, xml }) => {
        propertyContext.fromXML.configurationIndex?.collector.setIdentity(
          "Справочник.Товары.ТехническийUUID",
          "uuid",
          String(xml)
        )
      }
    )

    const yaml = importPropertiesWithSources({
      context,
      rule: {
        itemType: "TestDirectItem",
        properties: {
          technical: {
            type: "TestReferenceIndex",
            xml: "Technical",
            forReferenceOnly: true,
          },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: { Technical: "00000000-0000-4000-8000-000000000001" } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({})
    expect(indexCollector.fragment("test.yaml").entities).toEqual([
      {
        logicalAddress: "Справочник.Товары.ТехническийUUID",
        uuid: "00000000-0000-4000-8000-000000000001",
      },
    ])
  })

  it.each([
    ["alias", { Alias: "x" }, { xml: "Value", xmlAliases: ["Alias"], yaml: "Значение" }, "x"],
    ["parent", { Properties: { Value: "x" } }, { xml: "Value", xmlParents: ["Properties"], yaml: "Значение" }, "x"],
    ["model default", {}, { xml: "Value", yaml: "Значение", defaultValue: "x" }, "x"],
    ["empty default", { Value: "" }, { xml: "Value", yaml: "Значение", defaultValueXMLEmpty: "x" }, ""],
  ])("preserves %s XML selection", (_name, xml, property, expected) => {
    expect(runSingleProperty(property, xml)).toEqual({ Значение: expected })
  })

  it("импортирует очищенную скалярную ссылку расширения как null", () => {
    expect(runSingleProperty(
      { xml: "Value", yaml: "Значение", metadataTarget: { kind: "object", roots: ["Catalog"] } },
      { Value: undefined },
      {
        ...mockContextFromXML(),
        fromXML: { forReference: false, propertyStateCompatibilityMode: "Adaptation" },
        exportToYAML: { toTyped: true },
      },
    )).toEqual({ Значение: null })
  })

  it("не импортирует пустую скалярную ссылку основной конфигурации как null", () => {
    expect(runSingleProperty(
      { xml: "Value", yaml: "Значение", metadataTarget: { kind: "object", roots: ["Catalog"] } },
      { Value: undefined },
    )).toEqual({})
  })

  it.each([
    ["явное YAML-default", { Value: "yaml-default" }, {}],
    ["отсутствующий XML", {}, { Значение: "xml-implicit" }],
    ["явное отличающееся значение", { Value: "explicit" }, { Значение: "explicit" }],
  ])("импортирует implicitValueXML: %s", (_name, xml, expected) => {
    expect(
      runSingleProperty(
        {
          xml: "Value",
          yaml: "Значение",
          implicitValueYAML: "yaml-default",
          implicitValueXML: "xml-implicit",
        },
        xml
      )
    ).toEqual(expected)
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

  it("сохраняет явный XML-default в YAML, но не в снимке", () => {
    const indexCollector = createConfigurationIndexCollector()

    const yaml = importPropertiesFromXMLToYAML({
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
            implicitValueYAML: "Авто",
          },
        },
      } as MetadataItemRule,
      xml: { ExplicitDefault: "Авто", Caption: "Заголовок" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({ Заголовок: "Заголовок", ЯвноеПоУмолчанию: "Авто" })
    expect(indexCollector.fragment("test.yaml").entities).toEqual([])
  })

  it("не сохраняет пустую XML-форму reference-only свойства", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Справочник.Товары")

    const yaml = importPropertiesWithSources({
      context,
      rule: {
        itemType: "TestDirectItem",
        properties: {
          internalInfo: {
            type: "string",
            xml: "InternalInfo",
            forReferenceOnly: true,
          },
          name: {
            type: "string",
            xml: "Name",
            xmlParents: ["Properties"],
            yaml: "Имя",
          },
          resources: {
            type: "string",
            xml: "Resource",
            xmlParents: ["ChildObjects"],
            yaml: "Ресурсы",
          },
        },
      } as MetadataItemRule,
      sources: [
        {
          context,
          xml: {
            InternalInfo: {},
            Unknown: {},
            Properties: { Name: "Товары" },
            ChildObjects: { Resource: "Ресурс1" },
          },
        },
      ],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({ Имя: "Товары", Ресурсы: "Ресурс1" })
    expect(indexCollector.fragment("Справочник/Товары/Свойства.yaml").entities).toEqual([])
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

  it("откатывает побочные эффекты сломанного PropertyRule и продолжает assignment", () => {
    const failedType = "TestTransactionalFailure" as PropertyRuleType
    registerTypeRule(failedType, "collectLocalFactsFromYAML", ({ writer }) => {
      writer.setOwnerFact("failed", "leaked")
      throw new Error("broken local facts")
    })
    registerTypeRule(failedType, "importFromXMLToYAML", ({ context, traversal }) => {
      context.fromXML.configurationIndex?.collector.setIdentity("Лишний", "xmlId", "leaked")
      traversal.deferred?.accept({ valuePath: traversal.yamlPath, rulePath: traversal.rulePath })
      traversal.dependent?.accept({
        itemType: "TestTransactionalItem",
        itemYamlPath: [],
        propertyKey: "broken",
        yamlPath: traversal.yamlPath,
        xmlValue: "broken",
        presentInXML: true,
      })
      return "leaked"
    })
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      indexCollector,
      "Тест.Объект",
    )
    const collector = createLocalIndexesCollector()
    const deferred = createDeferredValuePathCollector()
    const dependent = createImportedDependentPropertyCollector()
    const root = parseXmlDocumentWithSaxes(
      "<Root><Broken>broken</Broken><Good>good</Good></Root>",
    ).roots[0]!
    const audit = createXmlImportAuditSession([root])

    const yaml = importPropertiesWithSources({
      context,
      rule: {
        itemType: "TestTransactionalItem",
        properties: {
          broken: { type: failedType, xml: "Broken", yaml: "Сломано" },
          good: { type: "string", xml: "Good", yaml: "Хорошее" },
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

    expect(yaml).toEqual({ Хорошее: "good" })
    expect(indexCollector.fragment("test.yaml").entities).toEqual([])
    expect(collector.finish().metadata).toEqual({
      events: [
        {
          kind: "property",
          yamlPath: ["Хорошее"],
          rulePath: [{ propertyKey: "good" }],
          propertyType: "string",
        },
      ],
    })
    expect(deferred.finish()).toEqual([])
    expect(dependent.finish()).toEqual([])
    expect(
      audit.outcomes().find(({ node }) => node.path === "/Root[1]/Good[1]")?.boundaries,
    ).toEqual([
      {
        itemType: "TestTransactionalItem",
        propertyKey: "good",
        propertyType: "string",
        yamlPath: ["Хорошее"],
        rulePath: [{ propertyKey: "good" }],
      },
    ])
    expect(audit.rawCandidates()).toMatchObject([
      {
        node: { path: "/Root[1]/Broken[1]" },
        boundary: {
          itemType: "TestTransactionalItem",
          propertyKey: "broken",
          propertyType: failedType,
          yamlPath: ["Сломано"],
          rulePath: [{ propertyKey: "broken" }],
        },
        error: { message: expect.stringContaining("broken") },
      },
    ])
  })

  it.each(xmlImportAttemptPhases)("пробрасывает ошибку инфраструктурной фазы %s без raw", (phase) => {
    const propertyType = `TestAttemptInfrastructure${phase}` as PropertyRuleType
    if (phase === "rollback") {
      registerTypeRule(propertyType, "importFromXMLToYAML", () => {
        throw new Error("conversion failed")
      })
    }
    const { collector, cause } = createFailingXmlImportAttempt({
      phase,
      causeMessage: `${phase} infrastructure failed`,
    })
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
    const root = parseXmlDocumentWithSaxes("<Root><Value>value</Value></Root>").roots[0]!
    const audit = createXmlImportAuditSession([root])

    const thrown = captureTestXmlImport({
      context,
      xml: root,
      rule: {
        itemType: `TestAttemptInfrastructureOwner${phase}`,
        properties: {
          value: {
            type: phase === "rollback" ? propertyType : "string",
            xml: "Value",
            yaml: "Значение",
          },
        },
      } as MetadataItemRule,
      collector,
      audit,
    })

    expectXmlImportInfrastructureFailure({ thrown, phase, cause, audit })
  })

  it("считает raw только DirectImportConversionError", () => {
    const propertyType = "TestConfigurationIndexInfrastructure" as PropertyRuleType
    registerTypeRule(propertyType, "collectConfigurationIndexFromXML", () => {
      throw new Error("configuration index infrastructure failed")
    })
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      indexCollector,
      "Тест.Объект",
    )
    const root = parseXmlDocumentWithSaxes("<Root><Value>ok</Value></Root>").roots[0]!
    const audit = createXmlImportAuditSession([root])

    expect(() => importPropertiesWithSources({
      context,
      rule: {
        itemType: "TestConfigurationIndexInfrastructureItem",
        properties: {
          value: { type: propertyType, xml: "Value", yaml: "Значение" },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: root }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
      audit,
    })).toThrow("configuration index infrastructure failed")
    expect(audit.rawCandidates()).toEqual([])
  })

  it("заявляет только структурные части, фактически прочитанные PropertyRule", () => {
    const selectiveType = "TestSelectiveStructuralRead" as PropertyRuleType
    registerTypeRule(selectiveType, "importFromXMLToYAML", ({ xml }) =>
      (xml as Record<string, unknown>).Known,
    )
    const { yaml, audit } = importAuditedStructuralProperty({
      propertyType: selectiveType,
      itemType: "TestSelectiveOwner",
      xml:
        '<Root><Value future="x"><Known>yes</Known>' +
        '<Unread extra="z">hidden</Unread><?mode code="m" unused?></Value></Root>',
    })
    audit.finalize()

    expect(yaml).toEqual({ Значение: "yes" })
    expect(valuePropertyAuditStates(audit)).toEqual([
      ["/Root[1]/Value[1]", "claimed"],
      ["/Root[1]/Value[1]/@future[1]", "unknown"],
      ["/Root[1]/Value[1]/Known[1]", "claimed"],
      ["/Root[1]/Value[1]/Known[1]/#text[1]", "claimed"],
      ["/Root[1]/Value[1]/Unread[1]", "unknown"],
      ["/Root[1]/Value[1]/Unread[1]/@extra[1]", "unknown"],
      ["/Root[1]/Value[1]/Unread[1]/#text[1]", "unknown"],
      ["/Root[1]/Value[1]/?mode[1]", "unknown"],
      ["/Root[1]/Value[1]/?mode[1]/@code[1]", "unknown"],
    ])
  })

  it("отмечает полностью распознанное пустое значение как осмысленно исключённое", () => {
    const propertyType = "TestSemanticallyElidedCollection" as PropertyRuleType
    registerTypeRule(propertyType, "importFromXMLToYAML", ({ xml }) => {
      JSON.stringify(xml)
      return []
    })
    const { yaml, audit } = importAuditedStructuralProperty({
      propertyType,
      itemType: "TestSemanticallyElidedOwner",
      xml: '<Root><Value kind="known"><Known>value</Known></Value></Root>',
    })
    audit.finalize()

    expect(yaml).toEqual({})
    expect(valuePropertyAuditStates(audit).map(([, state]) => state))
      .toEqual(Array(4).fill("semanticallyElided"))
  })

  it("считает полностью прочитанное и опущенное прямое значение восстановимым", () => {
    const propertyType = "TestSemanticallyElidedDirectValue" as PropertyRuleType
    registerTypeRule(propertyType, "importFromXMLToYAML", ({ xml }) => {
      JSON.stringify(xml)
      return undefined
    })
    const { yaml, audit } = importAuditedStructuralProperty({
      propertyType,
      itemType: "TestSemanticallyElidedDirectOwner",
      xml: "<Root><Value><Known>value</Known></Value></Root>",
    })
    audit.finalize()

    expect(yaml).toEqual({})
    expect(valuePropertyAuditStates(audit).map(([, state]) => state))
      .toEqual(Array(3).fill("semanticallyElided"))
  })

  it("заявляет точную XML-форму канонического raw-дефолта", () => {
    const propertyType = "TestCanonicalRawDefault" as PropertyRuleType
    registerTypeRule(propertyType, "importFromXMLToYAML", ({ xml }) =>
      (xml as Record<string, unknown> | undefined)?.["#text"],
    )
    const { yaml, audit } = importAuditedStructuralProperty({
      propertyType,
      itemType: "TestCanonicalRawDefaultOwner",
      property: { defaultValueXMLRaw: { "_xsi:nil": true } },
      xml: '<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Value xsi:nil="true"/></Root>',
    })
    audit.finalize()

    expect(yaml).toEqual({})
    expect(valuePropertyAuditStates(audit)).toEqual([
      ["/Root[1]/Value[1]", "claimed"],
      ["/Root[1]/Value[1]/@xsi:nil[1]", "claimed"],
    ])
  })

  it("не считает частично прочитанное пустое значение осмысленно исключённым", () => {
    const propertyType = "TestPartiallyElidedCollection" as PropertyRuleType
    registerTypeRule(propertyType, "importFromXMLToYAML", ({ xml }) => {
      void (xml as Record<string, unknown>).Known
      return []
    })
    const { yaml, audit } = importAuditedStructuralProperty({
      propertyType,
      itemType: "TestPartiallyElidedOwner",
      xml: "<Root><Value><Known>value</Known><Unknown>future</Unknown></Value></Root>",
    })
    audit.finalize()

    expect(yaml).toEqual({})
    expect(valuePropertyAuditStates(audit)).toEqual([
      ["/Root[1]/Value[1]", "claimed"],
      ["/Root[1]/Value[1]/Known[1]", "claimed"],
      ["/Root[1]/Value[1]/Known[1]/#text[1]", "claimed"],
      ["/Root[1]/Value[1]/Unknown[1]", "unknown"],
      ["/Root[1]/Value[1]/Unknown[1]/#text[1]", "unknown"],
    ])
  })

  it("компактно заявляет присутствующее свойство с fromXML false", () => {
    const { yaml, audit } = importAuditedStructuralProperty({
      propertyType: "string",
      itemType: "TestXmlOnlyOwner",
      property: { fromXML: false },
      xml: '<Root><Value xsi:nil="true"><Future code="x"/></Value></Root>',
    })
    audit.finalize()

    expect(yaml).toEqual({})
    const outcomes = audit.outcomes().filter(
      ({ node }) => node.path.startsWith("/Root[1]/Value[1]"),
    )
    expect(outcomes[0]).toMatchObject({
      state: "structurallyClaimed",
      boundaries: [{
        itemType: "TestXmlOnlyOwner",
        propertyKey: "value",
        propertyType: "string",
        yamlPath: ["Значение"],
        rulePath: [{ propertyKey: "value" }],
      }],
    })
    expect(outcomes.slice(1).every(({ state, boundaries }) =>
      state === "structurallyCovered" && boundaries.length === 0
    )).toBe(true)
  })

  it("отслеживает индекс повторов и enumeration атрибутов PI", () => {
    const indexedType = "TestIndexedStructuralRead" as PropertyRuleType
    registerTypeRule(indexedType, "importFromXMLToYAML", ({ xml }) => {
      const value = xml as Record<string, unknown>
      return {
        second: (value.Row as unknown[])[1],
        piKeys: Object.keys(value["?mode"] as object),
      }
    })
    const { yaml, audit } = importAuditedStructuralProperty({
      propertyType: indexedType,
      itemType: "TestIndexedOwner",
      xml: '<Root><Value><Row>one</Row><Row>two</Row><?mode code="m"?></Value></Root>',
    })
    audit.finalize()

    expect(audit.rawCandidates()).toEqual([])
    expect(yaml).toEqual({ Значение: { second: "two", piKeys: ["_code"] } })
    expect(
      audit.outcomes()
        .filter(({ node }) =>
          node.path.includes("/Row[") || node.path.includes("/?mode[1]"),
        )
        .map(({ node, state }) => [node.path, state]),
    ).toEqual([
      ["/Root[1]/Value[1]/Row[1]", "unknown"],
      ["/Root[1]/Value[1]/Row[1]/#text[1]", "unknown"],
      ["/Root[1]/Value[1]/Row[2]", "claimed"],
      ["/Root[1]/Value[1]/Row[2]/#text[1]", "claimed"],
      ["/Root[1]/Value[1]/?mode[1]", "claimed"],
      ["/Root[1]/Value[1]/?mode[1]/@code[1]", "claimed"],
    ])
  })

  it.each([
    {
      kind: "чтении разных значений",
      first: "1",
      second: "2",
      observe: (pi: Record<string, unknown>) => pi._a,
      expected: "2",
    },
    {
      kind: "enumeration разных значений",
      first: "1",
      second: "2",
      observe: (pi: Record<string, unknown>) => Object.keys(pi),
      expected: ["_a"],
    },
    {
      kind: "чтении одинаковых значений",
      first: "2",
      second: "2",
      observe: (pi: Record<string, unknown>) => pi._a,
      expected: "2",
    },
  ])(
    "заявляет последнюю effective occurrence при $kind repeated PI pseudoattribute",
    ({ kind, first, second, observe, expected }) => {
      const indexedType = `TestEffectivePIAttribute${kind}` as PropertyRuleType
      registerTypeRule(indexedType, "importFromXMLToYAML", ({ xml }) =>
        observe((xml as Record<string, unknown>)["?mode"] as Record<string, unknown>),
      )
      const { yaml, audit } = importAuditedStructuralProperty({
        propertyType: indexedType,
        itemType: `TestEffectivePIOwner${kind}`,
        xml: `<Root><Value><?mode a="${first}" a="${second}"?></Value></Root>`,
      })
      audit.finalize()

      expect(yaml).toEqual({ Значение: expected })
      expect(
        audit.outcomes()
          .filter(({ node }) => node.path.includes("/?mode[1]/@a["))
          .map(({ node, state }) => [node.path, state]),
      ).toEqual([
        ["/Root[1]/Value[1]/?mode[1]/@a[1]", "unknown"],
        ["/Root[1]/Value[1]/?mode[1]/@a[2]", "claimed"],
      ])
    },
  )

  it("не собирает aliases, present и пустую XML-форму", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Справочник.Товары")

    importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "Catalog",
        properties: {
          rowFilter: {
            type: "string",
            xml: "RowFilter",
            fromXML: false,
          },
          title: { type: "string", xml: "Title", xmlAliases: ["Caption"] },
          explicitDefault: {
            type: "string",
            xml: "ExplicitDefault",
            defaultValueXML: "Авто",
            preserveExplicitDefaultXML: true,
          },
        },
      } as MetadataItemRule,
      xml: { Caption: "Заголовок", RowFilter: {}, ExplicitDefault: "Авто" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    const fragment = indexCollector.fragment("Справочник/Товары/Свойства.yaml")
    expect(fragment.entities).toEqual([])
    expect(JSON.stringify(fragment.entities)).not.toMatch(/aliases|present|order/)
  })

  it("не сохраняет присутствие Color auto", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Форма.Основная")
    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "ClientApplicationForm",
        properties: { backgroundColor: { type: "Color", xml: "BackgroundColor", yaml: "ЦветФона" } },
      } as MetadataItemRule,
      xml: { BackgroundColor: "auto" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({})
    expect(indexCollector.fragment("Форма.yaml").entities).toEqual([])
  })

  it("не создаёт исключаемое свойство, отсутствующее в XML", () => {
    const yaml = importPropertiesFromXMLToYAML({
      context: mockContextFromXML(),
      rule: {
        itemType: "MetadataAttribute",
        properties: {
          synonym: {
            type: "I8nText",
            xml: "Synonym",
            yaml: "Синоним",
            excludeIfEqualNameYAML: true,
            defaultValue: { items: {} },
            xmlParents: ["Properties"],
          },
        },
      } as MetadataItemRule,
      xml: {},
      itemName: "Код",
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(yaml).toEqual({})
  })

  it("collects only XML identity attributes on the current logical address", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Справочник.Товары")
    importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "Catalog",
        properties: {
          uuid: { type: "string", xml: "_uuid", forReferenceOnly: true },
          id: { type: "string", xml: "_id", forReferenceOnly: true },
          name: { type: "string", xml: "_name" },
        },
      } as MetadataItemRule,
      xml: { _uuid: "00000000-0000-4000-8000-000000000001", _id: "42", _name: "Товары" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })
    importPropertiesFromXMLToYAML({
      context: withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Справочник.Товары.Значение[0]"),
      rule: {
        itemType: "Catalog",
        properties: { name: { type: "string", xml: "_name" } },
      } as MetadataItemRule,
      xml: { _name: "НепредставимоеАдресомИмя" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexCollector.fragment("Справочник/Товары/Свойства.yaml").entities).toEqual([
      {
        logicalAddress: "Справочник.Товары",
        uuid: "00000000-0000-4000-8000-000000000001",
        xmlId: "42",
      },
    ])
  })

  it("не сохраняет присутствие пустого XML-свойства, отсутствующего в YAML", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Отчёт.Продажи")
    importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "Report",
        properties: {
          result: { type: "number", xml: "Result", yaml: "Результат" },
          comment: { type: "string", xml: "Comment", yaml: "Комментарий", defaultValueXMLEmpty: "" },
        },
      } as MetadataItemRule,
      xml: { Result: { "_xsi:type": "xs:decimal", "#text": "3" }, Comment: "" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexCollector.fragment("Отчёт/Продажи/Свойства.yaml").entities).toEqual([])
  })

  it("не сохраняет скалярное XML-значение, отсутствующее в YAML", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Справочник.Товары")
    importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "Catalog",
        properties: {
          descriptionLength: {
            type: "number",
            xml: "DescriptionLength",
            yaml: "ДлинаНаименования",
            defaultValueXML: 25,
            implicitValueYAML: 30,
            omitNonImplicitReferenceXMLWhenYAMLMissing: true,
          },
        },
      } as MetadataItemRule,
      xml: { DescriptionLength: 30 },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexCollector.fragment("Справочник/Товары/Свойства.yaml").entities).toEqual([])
  })

  it("не сохраняет явно пустое XML-значение с defaultValueXMLEmpty", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Отчет.Остатки")
    importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "Report",
        properties: {
          extendedPresentation: {
            type: "string",
            xml: "ExtendedPresentation",
            yaml: "РасширенноеПредставление",
            defaultValueXMLEmpty: { items: {} },
          },
        },
      } as MetadataItemRule,
      xml: { ExtendedPresentation: "" },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexCollector.fragment("Отчет/Остатки/Свойства.yaml").entities).toEqual([])
  })

  it("не считает отсутствующее XML-свойство явно пустым", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Отчет.Остатки")
    importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "Report",
        properties: {
          extendedPresentation: {
            type: "string",
            xml: "ExtendedPresentation",
            yaml: "РасширенноеПредставление",
            preserveExplicitDefaultXML: true,
          },
        },
      } as MetadataItemRule,
      xml: {},
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexCollector.fragment("Отчет/Остатки/Свойства.yaml").entities).toEqual([])
  })

  it("не сохраняет xsi:nil в обычном состоянии снимка", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "РегистрСведений.Остатки")
    importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "InformationRegister",
        properties: {
          sourceValue: { type: "MetadataValue", xml: "SourceValue", yaml: "Исходное" },
          canonicalNil: {
            type: "MetadataValue",
            xml: "CanonicalNil",
            yaml: "Каноническое",
            defaultValueXMLRaw: { "_xsi:nil": true },
          },
          exportedNil: {
            type: "MetadataValue",
            xml: "ExportedNil",
            yaml: "Экспортируемое",
            exportNilValue: true,
          },
        },
      } as MetadataItemRule,
      xml: {
        SourceValue: { "_xsi:nil": true },
        CanonicalNil: { "_xsi:nil": true },
        ExportedNil: { "_xsi:nil": true },
      },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexCollector.fragment("РегистрСведений/Остатки/Свойства.yaml").entities).toEqual([])
  })

  it("does not collect XML service data while YAML-path index addressing is active", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(
      mockContextFromXML(),
      indexCollector,
      "Справочник.Товары.Свойство.Отбор"
    )
    importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "FilterLike",
        properties: {
          sourceValue: {
            type: "MetadataValue",
            xml: "SourceValue",
            yaml: "Значение",
            configurationIndexAddressing: "yamlPath",
          },
          sourceScalar: {
            type: "number",
            xml: "SourceScalar",
            yaml: "Скаляр",
            configurationIndexAddressing: "yamlPath",
            defaultValueXML: 25,
            implicitValueYAML: 30,
            omitNonImplicitReferenceXMLWhenYAMLMissing: true,
          },
        },
      } as MetadataItemRule,
      xml: { SourceValue: { "_xsi:nil": true }, SourceScalar: 30 },
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })

    expect(indexCollector.fragment("Форма.yaml").entities).toEqual([])
  })

  it("clears property XML node address when entering child item logical address", () => {
    const indexCollector = createConfigurationIndexCollector()
    const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Форма.Основная")
    runWithConfigurationIndexPropertyContext(context, "Элементы", undefined, (propertyContext) => {
      const itemContext = withConfigurationIndexLogicalAddress(propertyContext, "Форма.Основная.Элемент.Кнопка1")
      importPropertiesFromXMLToYAML({
        context: itemContext,
        rule: {
          itemType: "Button",
          properties: {
            title: { type: "string", xml: "Title", yaml: "Заголовок" },
            commandName: { type: "string", xml: "CommandName", yaml: "Команда" },
          },
        } as MetadataItemRule,
        xml: { Title: "Кнопка", CommandName: "Команда" },
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      })
    })

    expect(indexCollector.fragment("Форма.yaml").entities).toEqual([])
  })

  it("does not inherit a parent collection segment in a nested property", () => {
    const context = withConfigurationIndexCollector(
      mockContextFromXML(),
      createConfigurationIndexCollector(),
      "Документ.Заказ.ТабличнаяЧасть.Товары"
    )
    context.fromXML.configurationIndex = {
      ...context.fromXML.configurationIndex!,
      childCollectionUidSegment: "ТабличнаяЧасть",
    }

    runWithConfigurationIndexPropertyContext(context, "СтандартныеРеквизиты", undefined, (propertyContext) => {
      expect(propertyContext.fromXML.configurationIndex?.childCollectionUidSegment).toBeUndefined()
    })

    expect(context.fromXML.configurationIndex?.childCollectionUidSegment).toBe("ТабличнаяЧасть")
  })
})

function importAuditedStructuralProperty(params: {
  propertyType: PropertyRuleType
  itemType: string
  xml: string
  property?: Record<string, unknown>
}) {
  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
  const root = parseXmlDocumentWithSaxes(params.xml).roots[0]!
  const audit = createXmlImportAuditSession([root])
  const yaml = importPropertiesWithSources({
    context,
    rule: {
      itemType: params.itemType,
      properties: {
        value: {
          type: params.propertyType,
          xml: "Value",
          yaml: "Значение",
          ...params.property,
        },
      },
    } as MetadataItemRule,
    sources: [{ context, xml: root }],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
    audit,
  })
  return { yaml, audit }
}

function valuePropertyAuditStates(
  audit: ReturnType<typeof createXmlImportAuditSession>,
): Array<[string, string]> {
  return audit.outcomes()
    .filter(({ node }) => node.path.startsWith("/Root[1]/Value[1]"))
    .map(({ node, state }) => [node.path, state])
}

function runSingleProperty(
  property: Record<string, unknown>,
  xml: Record<string, unknown>,
  context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
): Record<string, unknown> | undefined {
  return importPropertiesFromXMLToYAML({
    context,
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

function importProfiledBoolean(propertyTypes: boolean) {
  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
  const profile = createDirectImportProfile({ propertyTypes })
  const yaml = importPropertiesWithSources({
    context,
    rule: {
      itemType: "TestProfiledItem",
      properties: {
        value: { type: "boolean", xml: "Value", yaml: "Значение" },
      },
    } as MetadataItemRule,
    sources: [{ context, xml: { Value: "true" } }],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
    profile,
  })
  return { profile, yaml }
}

type DirectImportParams = Parameters<typeof importPropertiesWithSources>[0]
type SingleSourceImportParams = Omit<DirectImportParams, "sources"> & { xml: Record<string, unknown> }

function importPropertiesFromXMLToYAML(params: DirectImportParams | SingleSourceImportParams) {
  if ("sources" in params) return importPropertiesWithSources(params)
  const { xml, ...rest } = params
  return importPropertiesWithSources({ ...rest, sources: [{ context: params.context, xml }] })
}
