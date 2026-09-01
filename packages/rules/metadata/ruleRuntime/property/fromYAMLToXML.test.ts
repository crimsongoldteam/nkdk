import { describe,expect,it } from "vitest"

import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { createConfigurationIndexCollector,createConfigurationIndexExportRuntime,importFromYAML,markYAMLScalarTag,parseMetadataYaml } from "@nkdk/runtime"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { testConfigurationIndexReader } from "../../../tests/configurationIndex"
import "../../commonObjects/i8nText/fromXML"
import "../../commonObjects/i8nText/fromYAML"
import "../../commonObjects/i8nText/toXML"
import "../../commonObjects/usePurposes/fromYAML"
import "../../commonObjects/usePurposes/toXML"
import { metadataRules } from "../../composition/metadataRules"
import type { ExportToXMLFunctionNew,ImportFromYAMLFunctionNew } from "./fn"
import { convertPropertiesFromYAMLToXML } from "./fromYAMLToXML"
import { createYAMLToXMLProfile,type YAMLToXMLNestedRule } from "./fromYAMLToXMLTypes"
import type { PropertyRuleType } from "./registry"
import { registerTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule,PropertyRule } from "./types"


const DEFAULT_TEST_LOGICAL_ADDRESS = "Catalog.Товары"

const context = (): ConfigurationContextWithExportToXML => ({
  languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
  version: "2.20",
  exportToXML: {

    version: "2.20",
    itemsTree: [],
  },
})

const testRule = (properties: Record<string, PropertyRule>, xmlOrder?: readonly string[]): MetadataItemRule =>
  ({ itemType: "Catalog", properties, xmlOrder }) as MetadataItemRule

const fillValueTestRule = (): MetadataItemRule => testRule({
  fillValue: {
    type: "MetadataValue",
    yaml: "ЗначениеЗаполнения",
    xml: "FillValue",
    defaultValueXMLRaw: { "_xsi:nil": true },
    exportNilValue: true,
  },
})

const typedFillValueTestRule = (): MetadataItemRule => testRule({
  type: { type: "TypeDescription", yaml: "Тип", xml: "Type" },
  fillValue: {
    type: "MetadataValue",
    yaml: "ЗначениеЗаполнения",
    xml: "FillValue",
    defaultValueXMLRaw: { "_xsi:nil": true },
    exportNilValue: true,
  },
})

const evaluatedMissingPropertyRule = (): MetadataItemRule => testRule({
  value: {
    type: "string",
    xml: "Value",
    yaml: "Значение",
    defaultValueXMLRaw: {},
    evaluateWhenYAMLMissing: true,
  } as PropertyRule,
})

const contextWithXMLDefaultVariant = (
  variant: "full" | "adopted" | "indexed",
  present: readonly string[] = [],
  storePresenceAsOrder = false,
  currentLogicalAddress = DEFAULT_TEST_LOGICAL_ADDRESS,
  xmlValues: readonly ({ logicalAddress: string } & Record<string, unknown> & {
    excludedEqualName?: true
  })[] = []
): ConfigurationContextWithExportToXML => {
  void present
  void storePresenceAsOrder
  void xmlValues
  return {
    ...context(),
    exportToXML: {
      ...context().exportToXML,
      configurationIndex: createConfigurationIndexExportRuntime({
        source: testConfigurationIndexReader(),
        collector: createConfigurationIndexCollector(),
        targetProjectPath: "Справочник/Товары/Свойства.yaml",
        logicalAddress: currentLogicalAddress,
      }),
      xmlDefaultVariantByLogicalAddress: {
        [DEFAULT_TEST_LOGICAL_ADDRESS]: variant,
      },
    },
  }
}

describe("convertPropertiesFromYAMLToXML", () => {
  it("профилирует преобразование по типам PropertyRule", () => {
    const profile = createYAMLToXMLProfile({ propertyTypes: true })

    convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Строка: "значение", Число: 42 },
      rule: testRule({
        stringValue: { type: "string", yaml: "Строка", xml: "StringValue" },
        numberValue: { type: "number", yaml: "Число", xml: "NumberValue" },
      }),
      outputs: [{ key: "owner" }],
      profile,
    })

    expect(profile.propertyTypeProfiles).toMatchObject({
      string: { propertyCount: 1 },
      number: { propertyCount: 1 },
    })
    for (const entry of Object.values(profile.propertyTypeProfiles)) {
      expect(entry.inclusiveMs).toBeGreaterThanOrEqual(entry.exclusiveMs)
      expect(entry.exclusiveMs).toBeGreaterThanOrEqual(0)
    }
  })

  it("не замедляет обычное преобразование профилированием типов PropertyRule", () => {
    const profile = createYAMLToXMLProfile()

    convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Строка: "значение" },
      rule: testRule({
        stringValue: { type: "string", yaml: "Строка", xml: "StringValue" },
      }),
      outputs: [{ key: "owner" }],
      profile,
    })

    expect(profile.propertyTypeProfiles).toEqual({})
  })

  it("восстанавливает исключённый заголовок по имени индексированного объекта", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("indexed"),
      yaml: {},
      rule: testRule({
        synonym: {
          type: "I8nText",
          yaml: "Синоним",
          xml: "Synonym",
          excludeIfEqualNameYAML: true,
        },
      }),
      name: "ДинамическийСписок",
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Synonym: {
        "v8:item": [{ "v8:lang": "ru", "v8:content": "Динамический список" }],
      },
    })
  })

  it("экспортирует свойства по xmlOrder независимо от reference XML", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Имя: "Группа", Группировка: "Vertical", Заголовок: "Заголовок" },
      rule: testRule(
        {
          name: { type: "string", yaml: "Имя", xml: "Name" },
          group: { type: "string", yaml: "Группировка", xml: "Group" },
          title: { type: "string", yaml: "Заголовок", xml: "Title" },
        },
        ["title", "group"]
      ),
      outputs: [{ key: "owner", referenceXML: { Name: "старое", Group: "старое", Title: "старое" } }],
    })

    const xml = result.outputs.get("owner")
    expect(Object.keys(xml ?? {})).toEqual(["Title", "Group", "Name"])
    expect(xml).toEqual({
      Title: "Заголовок",
      Group: "Vertical",
      Name: "Группа",
    })
  })

  it("does not apply implicitValueYAML to missing YAML", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Поле",
          xml: "Field",
          implicitValueYAML: "model-default",
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it.each([
    ["value", "Value"],
    ["fillValue", "FillValue"],
  ] as const)("evaluates missing sparse XML property regardless of key %s", (propertyKey, xmlKey) => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        [propertyKey]: {
          type: "string",
          xml: xmlKey,
          yaml: "Значение",
          defaultValueXMLRaw: {},
          evaluateWhenYAMLMissing: true,
        } as PropertyRule,
      }),
      outputs: [{ key: "owner" }],
      sparseYAML: true,
      omitDefaultsForSparseYAML: true,
    })

    expect(result.outputs.get("owner")).toEqual({ [xmlKey]: {} })
  })

  it.each(["indexed", "adopted"] as const)(
    "evaluates a computed XML property in %s mode when YAML is missing",
    (variant) => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant(variant),
      yaml: {},
      rule: evaluatedMissingPropertyRule(),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Value: {} })
    }
  )

  it.each([
    ["отсутствующий YAML", {}, { Value: "yaml-default" }],
    ["явный XML-implicit", { Значение: "xml-implicit" }, {}],
    ["явное отличающееся значение", { Значение: "explicit" }, { Value: "explicit" }],
  ])("экспортирует implicitValueXML: %s", (_name, yaml, expected) => {
    const property = {
      type: "string",
      xml: "Value",
      yaml: "Значение",
      implicitValueYAML: "yaml-default",
      implicitValueXML: "xml-implicit",
    } as PropertyRule
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml,
      rule: testRule({ value: property }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual(expected)
  })

  it("не сохраняет пустой XML-тег вместо implicitValueXML из reference", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        value: {
          type: "boolean",
          xml: "Value",
          yaml: "Значение",
          implicitValueYAML: false,
          implicitValueXML: false,
        },
      }),
      outputs: [{ key: "owner", referenceXML: { Value: false } }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it("вычисляет implicitValueYAML для отсутствующего YAML при implicitValueXML", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      name: "Товары",
      rule: testRule({
        value: {
          type: "string",
          xml: "Value",
          yaml: "Значение",
          implicitValueYAML: ({ name }: { name?: string }) => `yaml-${name}`,
          implicitValueXML: "xml-implicit",
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Value: "yaml-Товары" })
  })

  it("восстанавливает XML-default по rules без reference", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Поле",
          xml: "Field",
          defaultValueXML: "xml-default",
          implicitValueYAML: "model-default",
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Field: "xml-default" })
  })

  it("does not restore empty synonym from reference when YAML omits synonym", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: synonymRule(),
      name: "ПравилаОтправкиДокументов",
      outputs: [{ key: "owner", referenceXML: { Synonym: {} } }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it("exports explicit empty YAML synonym as empty XML", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Синоним: "" },
      rule: synonymRule(),
      name: "ПравилаОтправкиДокументов",
      outputs: [{ key: "owner", referenceXML: { Synonym: {} } }],
    })

    expect(result.outputs.get("owner")).toEqual({ Synonym: {} })
  })

  it("does not apply default synonym when YAML omits synonym and reference has no synonym", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: synonymRule(),
      name: "ПравилаОтправкиДокументов",
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it("uses explicit YAML synonym over empty synonym from reference", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Синоним: "Явный синоним" },
      rule: synonymRule(),
      name: "ПравилаОтправкиДокументов",
      outputs: [{ key: "owner", referenceXML: { Synonym: {} } }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Synonym: { "v8:item": [{ "v8:lang": "ru", "v8:content": "Явный синоним" }] },
    })
  })

  it("сразу передаёт атомарный результат fromYAML в toXML", () => {
    const calls: string[] = []
    registerTypeRule("TestAtomic" as never, "importFromYAML", (({ value }) => {
      calls.push(`from:${String(value)}`)
      return Number(value)
    }) as ImportFromYAMLFunctionNew)
    registerTypeRule("TestAtomic" as never, "exportToXML", (({ value }) => {
      calls.push(`to:${String(value)}`)
      return `xml:${String(value)}`
    }) as ExportToXMLFunctionNew)

    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Значение: "42" },
      rule: testRule({ value: { type: "TestAtomic" as never, yaml: "Значение", xml: "Value" } }),
      outputs: [{ key: "owner" }],
    })

    expect(calls).toEqual(["from:42", "to:42"])
    expect(result.outputs.get("owner")).toEqual({ Value: "xml:42" })
  })

  it("передаёт таблицу XML-аннотаций атомарному fromYAML", () => {
    const parsed = parseMetadataYaml("Значение:\n  !xml/invalid ru: Первый\n  !xml/invalid/2 ru: Второй")
    let received: unknown
    const rules = createRuleRegistrySet(metadataRules)
    rules.property.registerTypeRule("TestAnnotatedAtomic" as never, "importFromYAML", (({ value, annotations }) => {
      received = annotations
      return value
    }) as ImportFromYAMLFunctionNew)
    rules.property.registerTypeRule(
      "TestAnnotatedAtomic" as never,
      "exportToXML",
      (({ value }) => value) as ExportToXMLFunctionNew,
    )

    convertPropertiesFromYAMLToXML({
      execution: rules.execution,
      context: context(),
      yaml: parsed.data,
      annotations: parsed.annotations,
      rule: testRule({
        value: { type: "TestAnnotatedAtomic" as never, yaml: "Значение", xml: "Value" },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(received).toBe(parsed.annotations)
  })

  it("сохраняет временный путь значения с направленным уточнением XML", () => {
    const deferredType = "TestDeferredExport" as PropertyRuleType
    registerTypeRule(deferredType, "exportToXML", (({ value }) => value) as ExportToXMLFunctionNew)
    registerTypeRule(deferredType, "finalizeExportedXML", ({ value }) => `${String(value)}:final`)

    const converted = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Значение: "draft" },
      rule: testRule({
        value: { type: deferredType, yaml: "Значение", xml: "Value" },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(converted.deferredByOutput.get("owner")).toEqual([
      { valuePath: ["Value"], rulePath: [{ propertyKey: "value" }] },
    ])
  })

  it("собирает внешнее действие при посещении свойства в том же обходе", () => {
    const visits: string[] = []
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Модуль: "текст" },
      rule: testRule({ module: { type: "string", yaml: "Модуль", toXML: false } }),
      outputs: [{ key: "owner" }],
      externalWriteFactory: ({ propertyKey, source }) => {
        visits.push(propertyKey)
        return source.has(propertyKey) ? [{ kind: "handler", run: async () => undefined }] : []
      },
    })

    expect(visits).toEqual(["module"])
    expect(result.externalWrites).toHaveLength(1)
  })

  it("применяет defaultValue и defaultValueXML к отсутствующему YAML-свойству", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Значение",
          xml: "Value",
          defaultValue: "значение-по-умолчанию",
          defaultValueXML: "xml-по-умолчанию",
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Value: "xml-по-умолчанию" })
  })

  it("выбирает XML-default по варианту текущего metadata-объекта", () => {
    const rule = testRule({
      value: {
        type: "string",
        yaml: "Режим",
        xml: "Mode",
        defaultValue: "full-default",
        defaultValueXML: "full-xml",
        defaultValueAdoptedXML: "adopted-xml",
      },
    })

    const full = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("full"),
      yaml: {},
      rule,
      outputs: [{ key: "owner" }],
    })
    const adopted = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("adopted"),
      yaml: {},
      rule,
      outputs: [{ key: "owner" }],
    })

    expect(full.outputs.get("owner")).toEqual({ Mode: "full-xml" })
    expect(adopted.outputs.get("owner")).toEqual({ Mode: "adopted-xml" })
  })

  it("не создаёт индексированный XML-default, когда предметное условие экспорта ложно", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("indexed", ["value"]),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Значение",
          xml: "Value",
          defaultValueXML: "default",
          toXML: () => false,
          preserveUnknownReferenceXML: false,
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it("не применяет обычный XML-default к заимствованному объекту", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("adopted"),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Режим",
          xml: "Mode",
          defaultValue: () => "full-default",
          defaultValueXML: "full-xml",
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it.each([
    ["null", null, undefined],
    ["undefined", undefined, undefined],
    ["!проверять", {}, "проверять"],
    ["!изменять", {}, "изменять"],
  ] as const)("восстанавливает XML-default заимствованного объекта из %s", (_name, emptyValue, tag) => {
    const yaml: Record<string, unknown> = { Режим: emptyValue }
    if (tag !== undefined) markYAMLScalarTag(yaml, "Режим", tag)

    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("adopted"),
      yaml,
      rule: testRule({
        value: {
          type: "string",
          yaml: "Режим",
          xml: "Mode",
          defaultValueXML: "full-xml",
          implicitValueYAML: "model-default",
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Mode: "full-xml" })
  })

  it("применяет предметно обязательный XML-default к заимствованному объекту", () => {
    const property = {
      type: "string",
      yaml: "Режим",
      xml: "Mode",
      defaultValue: "default",
      defaultValueXML: "xml-default",
      toXML: () => true,
    } as const

    const adopted = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("adopted"),
      yaml: {},
      rule: testRule({ value: property }),
      outputs: [{ key: "owner" }],
    })
    const full = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("full"),
      yaml: {},
      rule: testRule({ value: property }),
      outputs: [{ key: "owner" }],
    })

    expect(adopted.outputs.get("owner")).toEqual({ Mode: "xml-default" })
    expect(full.outputs.get("owner")).toEqual({ Mode: "xml-default" })
  })

  it("вычисляет предметно обязательный default внутри разреженного заимствованного объекта", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("adopted"),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Режим",
          xml: "Mode",
          defaultValue: "default",
          defaultValueAdoptedXML: "adopted-xml",
          toXML: () => true,
        },
      }),
      outputs: [{ key: "owner" }],
      sparseYAML: true,
      omitDefaultsForSparseYAML: true,
    })

    expect(result.outputs.get("owner")).toEqual({ Mode: "adopted-xml" })
  })

  it("не применяет XML-default к заимствованному объекту при ложном предметном условии", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("adopted"),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Режим",
          xml: "Mode",
          defaultValue: "default",
          defaultValueXML: "xml-default",
          toXML: () => false,
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it("восстанавливает XML-default индексного варианта без состояния XML в снимке", () => {
    const property = {
      type: "string",
      yaml: "Режим",
      xml: "Mode",
      defaultValue: "full-default",
      defaultValueXML: "full-xml",
    } as const

    const absent = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("indexed"),
      yaml: {},
      rule: testRule({ value: property }),
      outputs: [{ key: "owner" }],
    })
    const present = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("indexed", ["value"]),
      yaml: {},
      rule: testRule({ value: property }),
      outputs: [{ key: "owner" }],
    })

    expect(absent.outputs.get("owner")).toEqual({ Mode: "full-xml" })
    expect(present.outputs.get("owner")).toEqual({ Mode: "full-xml" })
  })

  it("не использует порядок как XML-состояние, но восстанавливает XML-default", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("indexed", ["value"], true),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Режим",
          xml: "Mode",
          defaultValue: "full-default",
          defaultValueXML: "full-xml",
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Mode: "full-xml" })
  })

  it("преобразует синтезированный XML-default через обработчик типа", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("indexed", ["value"]),
      yaml: {},
      rule: testRule({
        value: {
          type: "UsePurposes",
          yaml: "Назначения",
          xml: "UsePurposes",
          defaultValue: ["PlatformApplication"],
          defaultValueXML: ["PlatformApplication"],
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      UsePurposes: {
        "v8:Value": {
          "_xsi:type": "app:ApplicationUsePurpose",
          "#text": "PlatformApplication",
        },
      },
    })
  })

  it("не заменяет простой XML-default на отличающийся YAML-default", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("indexed", ["value"]),
      yaml: {},
      rule: testRule({
        value: {
          type: "number",
          yaml: "Значение",
          xml: "Value",
          defaultValueXML: 9,
          implicitValueYAML: 10,
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Value: 9 })
  })

  it.each([
    undefined,
    { xsiNil: true as const },
    { xsiType: "xr:DesignTimeRef" },
    { xsiType: "xs:string", xmlText: "   " },
    { xsiType: "xs:dateTime", xmlText: "0001-01-01T00:00:00" },
  ])("использует канонический FillValue без YAML-поля %#", (xmlState) => {
    const result = convertPropertiesFromYAMLToXML({
      context: xmlState === undefined
        ? context()
        : contextWithXMLDefaultVariant(
            "indexed",
            [],
            false,
            DEFAULT_TEST_LOGICAL_ADDRESS,
            [{ logicalAddress: `${DEFAULT_TEST_LOGICAL_ADDRESS}.fillValue`, ...xmlState }],
          ),
      yaml: {},
      rule: fillValueTestRule(),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ FillValue: { "_xsi:nil": true } })
  })

  it("явное YAML-значение заполнения имеет приоритет над снимком", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant(
        "indexed",
        [],
        false,
        DEFAULT_TEST_LOGICAL_ADDRESS,
        [{ logicalAddress: `${DEFAULT_TEST_LOGICAL_ADDRESS}.fillValue`, xsiType: "xr:DesignTimeRef" }],
      ),
      yaml: { ЗначениеЗаполнения: "Новое" },
      rule: fillValueTestRule(),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      FillValue: { "_xsi:type": "xs:string", "#text": "Новое" },
    })
  })

  it("явная дата имеет приоритет над снимком начальной даты", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant(
        "indexed",
        [],
        false,
        DEFAULT_TEST_LOGICAL_ADDRESS,
        [{
          logicalAddress: `${DEFAULT_TEST_LOGICAL_ADDRESS}.fillValue`,
          xsiType: "xs:dateTime",
          xmlText: "0001-01-01T00:00:00",
        }],
      ),
      yaml: { ЗначениеЗаполнения: "09.08.2026 12:30:00" },
      rule: fillValueTestRule(),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      FillValue: { "_xsi:type": "xs:dateTime", "#text": "2026-08-09T12:30:00" },
    })
  })

  it.each([
    ["Булево", { "_xsi:nil": true }],
    ["Строка", { "_xsi:type": "xs:string" }],
  ] as const)("вычисляет канонический FillValue %s вместо reference XML", (type, expected) => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Тип: type },
      rule: typedFillValueTestRule(),
      outputs: [{ key: "owner", referenceXML: { FillValue: { "_xsi:type": "v8:TypeDescription" } } }],
    })

    expect(result.outputs.get("owner")).toMatchObject({ FillValue: expected })
  })

  it("восстанавливает исключённый из YAML синоним по rules без данных снимка", () => {
    const logicalAddress = DEFAULT_TEST_LOGICAL_ADDRESS
    const testContext = contextWithXMLDefaultVariant(
      "indexed",
      [],
      false,
      logicalAddress
    )
    const result = convertPropertiesFromYAMLToXML({
      context: testContext,
      yaml: {},
      rule: excludedEqualNameRule(),
      name: "ФормаЭлемента",
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Synonym: {
        "v8:item": [{
          "v8:lang": "ru",
          "v8:content": "Форма элемента",
        }],
      },
    })
    expect(JSON.stringify(
      testContext.exportToXML.configurationIndex!.collector.fragment("Свойства.yaml").entities
    )).not.toContain("excludedEqualName")
  })

  it("не восстанавливает отсутствовавший синоним заимствованного объекта", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("adopted"),
      yaml: {},
      rule: excludedEqualNameRule(),
      name: "ФормаЭлемента",
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it("не применяет модельный default отсутствовавшего свойства индексного варианта", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("indexed"),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Режим",
          xml: "Mode",
          defaultValue: "model-default",
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it("сохраняет явно заданное структурное YAML-значение", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("adopted", ["other"]),
      yaml: { Значение: { items: { ru: "" } } },
      rule: testRule({
        value: {
          type: "string",
          yaml: "Значение",
          xml: "Value",
          defaultValue: { items: { ru: "" } },
          defaultValueXMLRaw: "",
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Value: { items: { ru: "" } } })
  })

  it("сохраняет явно заданный пустой синоним из YAML", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("adopted", ["other"]),
      yaml: { Синоним: "" },
      rule: testRule({
        synonym: {
          type: "I8nText",
          yaml: "Синоним",
          xml: "Synonym",
          defaultValueXMLRaw: "",
          defaultValueXMLEmpty: { items: {} },
          defaultValue: () => ({ items: {} }),
          excludeIfEqualNameYAML: true,
          preserveEmptyXML: true,
        },
      }),
      name: "Товары",
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Synonym: {} })
  })

  it("не применяет обычные сырые XML-default к заимствованному объекту", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("adopted"),
      yaml: {},
      rule: testRule({
        raw: {
          type: "string",
          yaml: "Сырое",
          xml: "Raw",
          defaultValueXMLRaw: "",
        },
        empty: {
          type: "string",
          yaml: "Пустое",
          xml: "Empty",
          defaultValueXMLEmpty: [],
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it("наследует вариант XML-default во вложенном логическом адресе", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant(
        "adopted",
        [],
        false,
        `${DEFAULT_TEST_LOGICAL_ADDRESS}.external`
      ),
      yaml: {},
      rule: testRule({
        raw: {
          type: "string",
          yaml: "Сырое",
          xml: "Raw",
          defaultValueXMLRaw: "",
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it.each(["full", "adopted"] as const)(
    "сохраняет приоритет явного YAML-значения в режиме %s",
    (variant) => {
      const result = convertPropertiesFromYAMLToXML({
        context: contextWithXMLDefaultVariant(variant),
        yaml: { Режим: "explicit" },
        rule: testRule({
          value: {
            type: "string",
            yaml: "Режим",
            xml: "Mode",
            defaultValue: "full-default",
            defaultValueXML: "full-xml",
            defaultValueAdoptedXML: "adopted-xml",
          },
        }),
        outputs: [{ key: "owner" }],
      })

      expect(result.outputs.get("owner")).toEqual({ Mode: "explicit" })
    }
  )

  it("создаёт сырой пустой XML-контейнер для defaultValueXMLRaw", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Элементы: [] },
      rule: testRule({
        items: {
          type: "string",
          yaml: "Элементы",
          xml: "Item",
          xmlParents: ["ChildObjects"],
          defaultValue: [],
          defaultValueXMLRaw: {},
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ ChildObjects: {} })
  })

  it("не заменяет XML-родителя скалярным defaultValueXMLRaw пустой коллекции", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: contextWithXMLDefaultVariant("full", ["first", "items"], true),
      yaml: {},
      rule: testRule({
        first: {
          type: "string",
          yaml: "Первое",
          xml: "First",
          xmlParents: ["Properties"],
        },
        items: {
          type: "string",
          yaml: "Элементы",
          xml: "Items",
          xmlParents: ["Properties"],
          defaultValue: [],
          defaultValueXMLEmpty: [],
          defaultValueXMLRaw: "",
        },
      }),
      propertyValues: new Map([["first", "сохранить"]]),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Properties: {
        First: "сохранить",
        Items: "",
      },
    })
  })

  it("не переносит порядок обычного XML-узла в следующий снимок", () => {
    const testContext = contextWithXMLDefaultVariant(
      "full",
      ["first", "items"],
      true
    )

    convertPropertiesFromYAMLToXML({
      context: testContext,
      yaml: { Первое: "значение", Элементы: "элемент" },
      rule: testRule({
        first: { type: "string", yaml: "Первое", xml: "First" },
        items: { type: "string", yaml: "Элементы", xml: "Items" },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(
      JSON.stringify(testContext.exportToXML.configurationIndex!.collector.fragment("Свойства.yaml").entities)
    ).not.toMatch(/order|present/)
  })

  it("пишет канонический XML-ключ при копировании reference", () => {
    const referenceValue = { "_xsi:nil": true }
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Значение",
          xml: "CanonicalValue",
          xmlAliases: ["LegacyValue"],
        },
      }),
      outputs: [{ key: "owner", referenceXML: { LegacyValue: referenceValue } }],
    })

    expect(result.outputs.get("owner")).toEqual({ CanonicalValue: referenceValue })
  })

  it("восстанавливает канонический xsi:nil по exportNilValue без reference XML", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        value: {
          type: "MetadataValue",
          yaml: "Значение",
          xml: "Value",
          exportNilValue: true,
        },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Value: { "_xsi:nil": true } })
  })

  it("сохраняет reference XML для свойства без YAML-представления", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        formType: { type: "string", xml: "FormType", defaultValueXML: "Managed" },
      }),
      outputs: [{ key: "owner", referenceXML: { FormType: "Ordinary" } }],
    })

    expect(result.outputs.get("owner")).toEqual({ FormType: "Ordinary" })
  })

  it("сохраняет reference XML, когда YAML-свойство не задано", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        value: { type: "string", yaml: "Значение", xml: "Value" },
      }),
      outputs: [{ key: "owner", referenceXML: { Value: "исходное" } }],
    })

    expect(result.outputs.get("owner")).toEqual({ Value: "исходное" })
  })

  it("does not use reference XML when the property disables reference preservation", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        value: {
          type: "string",
          yaml: "Значение",
          xml: "Value",
          preserveUnknownReferenceXML: false,
        },
      }),
      outputs: [{ key: "owner", referenceXML: { Value: "исходное" } }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it("сохраняет reference XML для отключённого общего экспорта", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        value: { type: "string", yaml: "Значение", xml: "Value", toXML: false },
      }),
      outputs: [{ key: "owner", referenceXML: { Value: {} } }],
    })

    expect(result.outputs.get("owner")).toEqual({ Value: {} })
  })

  it("сохраняет декларативный порядок свойств отдельно для каждого XML-файла", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Заголовок: "форма", Значение: "объект", Ширина: 20 },
      rule: testRule({
        value: { type: "string", yaml: "Значение", xml: "Value", tag: "metadata" },
        width: { type: "string", yaml: "Ширина", xml: "Width", tag: "form" },
        title: { type: "string", yaml: "Заголовок", xml: "Title", tag: "form" },
      }),
      outputs: [
        { key: "metadata", tags: ["metadata"], referenceXML: { Value: "старое" } },
        { key: "form", tags: ["form"], referenceXML: { Title: "старая", Width: 10 } },
      ],
    })

    expect(Object.keys(result.outputs.get("form")!)).toEqual(["Width", "Title"])
  })

  it("вставляет отсутствующее в reference свойство на декларативную позицию", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Первое: "1", Новое: "2", Последнее: "3" },
      rule: testRule({
        first: { type: "string", yaml: "Первое", xml: "First" },
        added: { type: "string", yaml: "Новое", xml: "Added" },
        last: { type: "string", yaml: "Последнее", xml: "Last" },
      }),
      outputs: [{ key: "owner", referenceXML: { Last: "старое", First: "старое" } }],
    })

    expect(Object.keys(result.outputs.get("owner")!)).toEqual(["First", "Added", "Last"])
  })

  it("создаёт пустое значение по умолчанию внутри разреженной коллекции", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        value: { type: "string", yaml: "Значение", xml: "Value", defaultValueXMLRaw: "" },
      }),
      outputs: [{ key: "owner" }],
      sparseYAML: true,
    })

    expect(result.outputs.get("owner")).toEqual({ Value: "" })
  })

  it("передаёт массив reference XML во вложенную коллекцию", () => {
    registerTypeRule("NestedReferenceCollection" as never, "yamlToXMLNestedRule", {
      kind: "collection",
      itemRule: testRule({
        name: { type: "string", xml: "Name" },
        retained: { type: "string", xml: "Retained" },
      }),
      yamlShape: "record",
    })

    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Элементы: { Первый: {} } },
      rule: testRule({
        items: { type: "NestedReferenceCollection" as never, yaml: "Элементы", xml: "Items" },
      }),
      outputs: [{ key: "owner", referenceXML: { Items: [{ Name: "Первый", Retained: "да" }] } }],
    })

    expect(result.outputs.get("owner")).toEqual({ Items: [{ Name: "Первый", Retained: "да" }] })
  })

  it("сохраняет пустой XML-контейнер коллекции из reference", () => {
    registerTypeRule("EmptyReferenceCollection" as never, "yamlToXMLNestedRule", {
      kind: "collection",
      itemRule: testRule({ name: { type: "string", xml: "Name" } }),
      yamlShape: "record",
    })

    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Элементы: {} },
      rule: testRule({
        items: {
          type: "EmptyReferenceCollection" as never,
          yaml: "Элементы",
          xml: "Items",
          defaultValueXMLEmpty: [],
        },
      }),
      outputs: [{ key: "owner", referenceXML: { Items: undefined } }],
    })

    expect(result.outputs.get("owner")).toEqual({ Items: {} })
  })

  it("сохраняет пустой корневой XML-контейнер коллекции из reference", () => {
    registerTypeRule("EmptyRootReferenceCollection" as never, "yamlToXMLNestedRule", {
      kind: "collection",
      itemRule: testRule({ name: { type: "string", xml: "Name" } }),
      xmlElement: "Item",
      yamlShape: "record",
    })

    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Элементы: {} },
      rule: testRule({
        Items: {
          type: "EmptyRootReferenceCollection" as never,
          yaml: "Элементы",
          defaultValueXMLEmpty: [],
        },
      }),
      outputs: [{ key: "owner", referenceXML: { Items: undefined } }],
    })

    expect(result.outputs.get("owner")).toEqual({ Items: {} })
  })

  it("не добавляет отсутствующее YAML-свойство в существующий reference XML", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        items: {
          type: "NestedCollection" as never,
          yaml: "Элементы",
          xml: "Items",
          defaultValueXMLEmpty: [],
        },
      }),
      outputs: [{ key: "owner", referenceXML: { Existing: true } }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })

  it("пишет значение по полному пути xmlParents", () => {
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Значение: "текст" },
      rule: testRule({
        value: { type: "string", yaml: "Значение", xml: "Value", xmlParents: ["Properties"] },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Properties: { Value: "текст" } })
  })

  it("указывает YAML-ключ в ошибке атомарного обработчика", () => {
    registerTypeRule("ThrowingAtomic" as never, "importFromYAML", () => {
      throw new Error("неверное значение")
    })

    expect(() =>
      convertPropertiesFromYAMLToXML({
        context: context(),
        yaml: { Значение: "ошибка" },
        rule: testRule({ value: { type: "ThrowingAtomic" as never, yaml: "Значение", xml: "Value" } }),
        outputs: [{ key: "owner" }],
      })
    ).toThrow(/YAML-путь: Значение[\s\S]*неверное значение/)
  })

  it("сохраняет явно заданную строку MetadataValue строкой", () => {
    const yaml = importFromYAML<Record<string, unknown>>('Значение: "001"')
    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml,
      rule: testRule({ value: { type: "MetadataValue", yaml: "Значение", xml: "Value" } }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Value: { "_xsi:type": "xs:string", "#text": "001" },
    })
  })

  it("передаёт toXML-обработчику источник сырого YAML", () => {
    registerTypeRule("SourceAwareAtomic" as never, "exportToXML", (({ source, value }) => ({
      "#text": value,
      _sibling: source?.raw("sibling"),
    })) as ExportToXMLFunctionNew)

    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Значение: "основное", Соседнее: "сырое" },
      rule: testRule({
        value: { type: "SourceAwareAtomic" as never, yaml: "Значение", xml: "Value" },
        sibling: { type: "string", yaml: "Соседнее", toXML: false },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Value: { "#text": "основное", _sibling: "сырое" },
    })
  })

  it("предпочитает вложенный описатель старым обработчикам коллекции", () => {
    const nestedItemRule = testRule({
      name: { type: "string", xml: "Name" },
      value: { type: "string", yaml: "Значение", xml: "Value" },
    })
    registerTypeRule("NestedCollection" as never, "yamlToXMLNestedRule", {
      kind: "collection",
      itemRule: nestedItemRule,
      yamlShape: "record",
      xmlElement: "Item",
    })
    registerTypeRule("NestedCollection" as never, "importFromYAML", () => {
      throw new Error("старый модельный обработчик вызван")
    })

    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: { Элементы: { Первый: { Значение: "A" } } },
      rule: testRule({
        items: { type: "NestedCollection" as never, yaml: "Элементы", xml: "Item" },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Item: [{ Name: "Первый", Value: "A" }] })
  })

  it("переносит nested XML-аннотации на новый mapping normalizeYAML", () => {
    const rules = createRuleRegistrySet(metadataRules)
    const parsed = parseMetadataYaml([
      "Родитель:",
      "  Вложенное:",
      "    - Значение: !xml/raw",
      "        $значение: value",
      "        $xml: { _future: x }",
    ].join("\n"))
    let normalized: Record<string, unknown> | undefined
    rules.property.registerTypeRule("AnnotatedNormalizedItem" as never, "yamlToXMLNestedRule", {
      kind: "item",
      itemRule: testRule({}),
      normalizeYAML: ({ yaml, annotations }) => {
        expect(annotations).toBe(parsed.annotations)
        normalized = structuredClone(yaml as Record<string, unknown>)
        return normalized
      },
    } as YAMLToXMLNestedRule)

    convertPropertiesFromYAMLToXML({
      execution: rules.execution,
      context: context(),
      yaml: parsed.data,
      annotations: parsed.annotations,
      rule: testRule({
        parent: { type: "AnnotatedNormalizedItem" as never, yaml: "Родитель", xml: "Parent" },
      }),
      outputs: [{ key: "owner" }],
    })

    const nested = normalized?.Вложенное as Array<Record<string, unknown>>
    expect(parsed.annotations.at(nested[0]!, "Значение")).toMatchObject({
      kind: "raw",
      target: "value",
    })
  })

  it("не обходит отсутствующий необязательный вложенный объект", () => {
    const nestedItemRule = testRule({
      child: { type: "OptionalNested" as never, yaml: "Дочерний", xml: "Child" },
    })
    registerTypeRule("OptionalNested" as never, "yamlToXMLNestedRule", {
      kind: "item",
      itemRule: nestedItemRule,
    })

    const result = convertPropertiesFromYAMLToXML({
      context: context(),
      yaml: {},
      rule: testRule({
        child: { type: "OptionalNested" as never, yaml: "Дочерний", xml: "Child" },
      }),
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({})
  })
})

function synonymRule(): MetadataItemRule {
  return testRule({
    synonym: {
      type: "I8nText",
      yaml: "Синоним",
      xml: "Synonym",
      preserveEmptyXML: true,
      implicitValueYAML: ({ name }: { name?: string }) => ({ items: { ru: name ?? "" } }),
    },
  })
}

function excludedEqualNameRule(): MetadataItemRule {
  return testRule({
    synonym: {
      type: "I8nText",
      yaml: "Синоним",
      xml: "Synonym",
      excludeIfEqualNameYAML: true,
      defaultValueXMLEmpty: { items: {} },
    },
  })
}
