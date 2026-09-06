import { describe, expect, it } from "vitest"

import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { parseMetadataYaml } from "@nkdk/runtime"
import { xmlExport, isXmlElementNode } from "@nkdk/runtime"
import { yamlScalarTagAt } from "@nkdk/runtime"
import type { YAMLToXMLNestedRule } from "../property/fromYAMLToXMLTypes"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import { convertMetadataItemFromYAMLToXML } from "../metadataItem/fromYAMLToXML"
import { convertPropertiesFromYAMLToXML } from "../property/fromYAMLToXML"
import { convertMetadataCollectionFromYAMLToXML } from "./fromYAMLToXML"
import { testConfigurationIndexReader } from "../../../tests/configurationIndex"
import { mockLanguages } from "../../../tests/mockContext"

const context = (): ConfigurationContextWithExportToXML => ({
  languages: mockLanguages,
  version: "2.20",
  exportToXML: { version: "2.20", itemsTree: [] },
})

const nestedRule = {
  itemType: "CatalogAttribute",
  properties: {
    name: { type: "string", xml: "Name" },
    code: { type: "string", yaml: "Код", xml: "Code" },
    value: { type: "string", yaml: "Значение", xml: "Value" },
  },
} as const satisfies MetadataItemRule

function collectReferences(received: unknown[][]): typeof convertMetadataItemFromYAMLToXML {
  return ({ outputs }) => {
    received.push(outputs.map(({ referenceXML }) => referenceXML))
    return { outputs: new Map(outputs.map(({ key }) => [key, {}])), deferredByOutput: new Map(), externalWrites: [] }
  }
}

describe("convertMetadataCollectionFromYAMLToXML", () => {
  it("выбирает общее правило коллекции один раз", () => {
    let resolutions = 0
    const alternateRule: MetadataItemRule = {
      itemType: "AlternateValue",
      properties: { value: { type: "string", yaml: "Значение", xml: "Special" } },
    }
    const result = convertMetadataCollectionFromYAMLToXML({
      convertItem: convertMetadataItemFromYAMLToXML,
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(),
      yaml: [{ Значение: "a" }, { Значение: "b" }, { Значение: "c" }],
      propertyRule: { type: "string" },
      descriptor: {
        kind: "collection", itemRule: nestedRule, yamlShape: "array", xmlElement: "Item",
        itemRuleFromProperty: () => { resolutions++; return alternateRule },
      },
      outputs: [{ key: "owner" }],
    })
    expect(result.outputs.get("owner")).toEqual({ Item: [{ Special: "a" }, { Special: "b" }, { Special: "c" }] })
    expect(resolutions).toBe(1)
  })

  it("передаёт raw-элемент выходу без потери смешанного порядка", () => {
    const parsed = parseMetadataYaml([
      "Узел: !xml/raw",
      "  $xml:",
      '    _id: "7"',
      '    "#text": [до, после]',
      '    Child: [первый, второй]',
      '    "#order": ["#text", Child, "#text", Child]',
    ].join("\n"))
    const result = convertMetadataCollectionFromYAMLToXML({
      convertItem: convertMetadataItemFromYAMLToXML,
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(), yaml: parsed.data, annotations: parsed.annotations,
      descriptor: { kind: "collection", itemRule: nestedRule, yamlShape: "record", xmlElement: "Item" },
      outputs: [{ key: "owner" }],
    })
    const xml = result.outputs.get("owner")!
    expect(xmlExport(xml, false)).toBe('<Item id="7">до<Child>первый</Child>после<Child>второй</Child></Item>')
    expect(Array.isArray(xml.Item) && isXmlElementNode(xml.Item[0])).toBe(true)
  })

  it.each([10, 100])("подготавливает reference коллекции один раз для %i элементов", (size) => {
    let unwrapped = 0
    let identities = 0
    const items = Array.from({ length: size }, (_, index) => ({ Code: String(index), Unknown: index }))
    const received: unknown[][] = []
    convertMetadataCollectionFromYAMLToXML({
      convertItem: collectReferences(received),
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(),
      yaml: items.map(({ Code }) => ({ Код: Code })).reverse(),
      descriptor: {
        kind: "collection", itemRule: nestedRule, yamlShape: "array", xmlElement: "Item",
        unwrapReferenceItem: ({ xml }) => { unwrapped++; return xml },
        referenceIdentity: {
          fromXML: ({ xml }) => { identities++; return String(xml.Code) },
          fromYAML: ({ yaml }) => String((yaml as { Код: string }).Код),
        },
      },
      outputs: [{ key: "owner", referenceXML: { Item: items } }],
    })
    expect(received).toEqual([...items].reverse().map(item => [item]))
    expect(unwrapped).toBe(size)
    expect(identities).toBe(size)
  })

  it.each(["code", "name"] as const)("индексирует первое совпадение reference по %s, не сканируя коллекцию для каждого item", (key) => {
    let reads = 0
    const items = Array.from({ length: 20 }, (_, index) => ({
      get Code() { reads++; return String(index) },
      get Name() { reads++; return String(index) },
    }))
    const received: unknown[][] = []
    convertMetadataCollectionFromYAMLToXML({
      convertItem: collectReferences(received),
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(),
      yaml: key === "code" ? items.map((_, index) => ({ Код: String(index) }))
        : Object.fromEntries(items.map((_, index) => [String(index), {}])),
      descriptor: {
        kind: "collection", itemRule: nestedRule, xmlElement: "Item",
        yamlShape: key === "code" ? "array" : "record", keyField: key,
      },
      outputs: [{ key: "owner", referenceXML: { Item: [...items, { Code: "0", Name: "0" }] } }],
    })
    expect(received).toEqual(items.map(item => [item]))
    // Для record дополнительно один проход нужен, чтобы собрать имена канонического состава.
    expect(reads).toBe(key === "code" ? 20 : 40)
  })

  it("не выбирает неоднозначную reference identity и отделяет индексы правил и выходов", () => {
    const alternateRule: MetadataItemRule = { ...nestedRule, itemType: "AlternateAttribute" }
    const references = [
      { Left: { Code: "duplicate" }, Right: { Code: "duplicate" } },
      { Left: { Code: "duplicate" }, Right: { Code: "unique" } },
      { Left: { Code: "duplicate" }, Right: { Code: "other" } },
    ]
    const received: unknown[][] = []
    convertMetadataCollectionFromYAMLToXML({
      convertItem: collectReferences(received),
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(),
      yaml: [{ Код: "duplicate" }, { Код: "unique" }, { Код: "missing" }],
      descriptor: {
        kind: "collection", itemRule: nestedRule, yamlShape: "array", xmlElement: "Item",
        resolveItemRule: ({ index }) => index === 0 ? nestedRule : alternateRule,
        unwrapReferenceItem: ({ xml, itemRule }) => xml[itemRule === nestedRule ? "Left" : "Right"] as Record<string, unknown>,
        referenceIdentity: {
          fromXML: ({ xml }) => String(xml.Code),
          fromYAML: ({ yaml }) => String((yaml as { Код: string }).Код),
        },
      },
      outputs: [
        { key: "owner", referenceXML: { Item: references } },
        { key: "external", referenceXML: { Item: [references[1]] } },
      ],
    })
    expect(received).toEqual([
      [undefined, references[1]!.Left],
      [references[1]!.Right, references[1]!.Right],
      [undefined, undefined],
    ])
  })

  it("переносит nested XML-аннотации на новый mapping normalizeItemYAML", () => {
    const parsed = parseMetadataYaml([
      "Код:",
      "  СтандартныеРеквизиты: !xml/standard-attributes",
      "  Вложенное:",
      "    - Значение: !xml/raw",
      "        $значение: value",
      "        $xml: { _future: x }",
    ].join("\n"))
    let normalized: Record<string, unknown> | undefined
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      yamlShape: "record",
      normalizeItemYAML: ({ yaml, annotations }) => {
        expect(annotations).toBe(parsed.annotations)
        normalized = structuredClone(yaml as Record<string, unknown>)
        return normalized
      },
    } as const satisfies YAMLToXMLNestedRule

    convertMetadataCollectionFromYAMLToXML({
      convertItem: (params) => {
        expect(yamlScalarTagAt(params.yaml, "СтандартныеРеквизиты"))
          .toBe("xml/standard-attributes")
        const nested = (params.yaml as Record<string, unknown>).Вложенное as Array<Record<string, unknown>>
        expect(params.annotations?.at(nested[0]!, "Значение")).toMatchObject({
          kind: "raw",
          target: "value",
        })
        return { outputs: new Map([["owner", {}]]), deferredByOutput: new Map(), externalWrites: [] }
      },
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(),
      yaml: parsed.data,
      annotations: parsed.annotations,
      descriptor,
      outputs: [{ key: "owner" }],
    })

    expect(normalized).toBeDefined()
  })

  it("восстанавливает повторные логические ключи из таблицы XML-аннотаций", () => {
    const parsed = parseMetadataYaml([
      "Код:",
      "  Значение: first",
      "!xml/invalid Код:",
      "  Значение: second",
      "!xml/invalid/2 Код:",
      "  Значение: third",
    ].join("\n"))
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      yamlShape: "record",
      xmlElement: "Item",
    } as const satisfies YAMLToXMLNestedRule

    const result = convertMetadataCollectionFromYAMLToXML({
      convertItem: convertMetadataItemFromYAMLToXML,
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(),
      yaml: parsed.data,
      annotations: parsed.annotations,
      descriptor,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Item: [
        { Name: "Код", Value: "first" },
        { Name: "Код", Value: "second" },
        { Name: "Код", Value: "third" },
      ],
    })
  })

  it("не теряет XML-порядок дублей при дополнении канонической коллекции", () => {
    const parsed = parseMetadataYaml([
      "Код:",
      "  Значение: first",
      "Наименование:",
      "  Значение: title",
      "!xml/invalid Код:",
      "  Значение: second",
    ].join("\n"))
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      yamlShape: "record",
      xmlElement: "Item",
      completeItemNames: () => ["Код", "Наименование"],
    } as const satisfies YAMLToXMLNestedRule

    const result = convertMetadataCollectionFromYAMLToXML({
      convertItem: convertMetadataItemFromYAMLToXML,
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(),
      yaml: parsed.data,
      annotations: parsed.annotations,
      descriptor,
      propertyRule: { type: "string" } as PropertyRule,
      source: {
        has: () => true,
        raw: () => parsed.data,
        yamlKey: () => "Элементы",
      },
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Item: [
        { Name: "Код", Value: "first" },
        { Name: "Наименование", Value: "title" },
        { Name: "Код", Value: "second" },
      ],
    })
  })

  it("рекурсивно преобразует YAML-запись коллекции без массива моделей", () => {
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      yamlShape: "record",
      xmlElement: "Item",
    } as const satisfies YAMLToXMLNestedRule

    const result = convertMetadataCollectionFromYAMLToXML({
      convertItem: convertMetadataItemFromYAMLToXML,
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(),
      yaml: { Первый: { Значение: "A" }, Второй: { Значение: "B" } },
      descriptor,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Item: [
        { Name: "Первый", Value: "A" },
        { Name: "Второй", Value: "B" },
      ],
    })
  })

  it("сопоставляет элементы YAML-массива с сырым reference XML по keyField", () => {
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      yamlShape: "array",
      xmlElement: "Item",
      keyField: "code",
    } as const satisfies YAMLToXMLNestedRule

    const result = convertMetadataCollectionFromYAMLToXML({
      convertItem: convertMetadataItemFromYAMLToXML,
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(),
      yaml: [
        { Код: "A", Значение: "новое A" },
        { Код: "B", Значение: "новое B" },
      ],
      descriptor,
      outputs: [
        {
          key: "owner",
          referenceXML: {
            Item: [
              { Code: "B", Unknown: "для B" },
              { Code: "A", Unknown: "для A" },
            ],
          },
        },
      ],
    })

    expect(result.outputs.get("owner")).toEqual({
      Item: [
        { Code: "A", Value: "новое A", Unknown: "для A" },
        { Code: "B", Value: "новое B", Unknown: "для B" },
      ],
    })
  })

  it("выбирает правила каждого элемента полиморфной коллекции", () => {
    const alternateRule = {
      itemType: "AlternateAttribute",
      xsiType: "test:Alternate",
      properties: {
        alternate: { type: "string", yaml: "Другое", xml: "Alternate" },
      },
    } as const satisfies MetadataItemRule
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      resolveItemRule: ({ yaml }) =>
        typeof yaml === "object" && yaml !== null && "Другое" in yaml ? alternateRule : nestedRule,
      yamlShape: "array",
      xmlElement: "Item",
    } as const satisfies YAMLToXMLNestedRule

    const result = convertMetadataCollectionFromYAMLToXML({
      convertItem: convertMetadataItemFromYAMLToXML,
      convertProperties: convertPropertiesFromYAMLToXML,
      context: context(),
      yaml: [{ Значение: "обычное" }, { Другое: "особое" }],
      descriptor,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      Item: [{ Value: "обычное" }, { "_xsi:type": "test:Alternate", Alternate: "особое" }],
    })
  })

  it("не сохраняет общий порядок элементов массива в снимке", () => {
    const collector = createConfigurationIndexCollector()
    const configurationIndex = createConfigurationIndexExportRuntime({
      source: testConfigurationIndexReader(),
      collector,
      targetProjectPath: "test.yaml",
      logicalAddress: "Тест",
    })
    const descriptor = {
      kind: "collection",
      itemRule: nestedRule,
      yamlShape: "array",
      xmlElement: "Item",
      keyField: "code",
      configurationIndexUidSegment: "Элемент",
    } as const satisfies YAMLToXMLNestedRule

    convertMetadataCollectionFromYAMLToXML({
      convertItem: convertMetadataItemFromYAMLToXML,
      convertProperties: convertPropertiesFromYAMLToXML,
      context: {
        ...context(),
        exportToXML: { ...context().exportToXML, configurationIndex },
      },
      yaml: [
        { Код: "A", Значение: "первое" },
        { Код: "B", Значение: "второе" },
      ],
      descriptor,
      outputs: [{ key: "owner" }],
    })

    expect(JSON.stringify(collector.fragment("test.yaml").entities)).not.toMatch(/order|present|aliases/)
  })
})
