import { describe, expect, it } from "vitest"

import { importFromYAML } from "../../../yaml/import"
import "../../commonObjects/i8nText/fromXML"
import "../../commonObjects/i8nText/fromYAML"
import "../../commonObjects/i8nText/toXML"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule, PropertyRule } from "./types"
import type { ExportToXMLFunctionNew, ImportFromYAMLFunctionNew } from "./fn"
import { registerTypeRule } from "./typeRuleRegistry"
import { convertPropertiesFromYAMLToXML } from "./fromYAMLToXML"
import type { PropertyRuleType } from "./registry"

const context = (): ConfigurationContextWithExportToXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: {
    configDumpInfo: new Map(),
    version: "2.20",
    itemsTree: [],
  },
})

const testRule = (properties: Record<string, PropertyRule>): MetadataItemRule =>
  ({ itemType: "Catalog", properties }) as MetadataItemRule

describe("convertPropertiesFromYAMLToXML", () => {
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

  it("сохраняет XML-алиас и исходное значение для preserveFromReferenceXML", () => {
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
          preserveFromReferenceXML: true,
        },
      }),
      outputs: [{ key: "owner", referenceXML: { LegacyValue: referenceValue } }],
    })

    expect(result.outputs.get("owner")).toEqual({ LegacyValue: referenceValue })
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

  it("сохраняет порядок свойств отдельно для каждого XML-файла", () => {
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

    expect(Object.keys(result.outputs.get("form")!)).toEqual(["Title", "Width"])
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
