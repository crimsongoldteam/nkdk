import { describe, expect, it } from "vitest"

import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { parseMetadataYaml } from "@nkdk/runtime"
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

describe("convertMetadataCollectionFromYAMLToXML", () => {
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
