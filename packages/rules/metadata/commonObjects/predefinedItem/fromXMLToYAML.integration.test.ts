import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  serializeDirectXML,
  testPropertyFixtureThroughYAML,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { importContentFromXML, yamlScalarTagAt } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { mockContextToXML } from "../../../tests/mockContext"

import "./index"

const collectionRule = probeRule("PredefinedItemCollection")
const fixtures = ["group.xml", "item.xml", "typed-code.xml"] as const

describe("PredefinedItem XML → YAML", () => {
  it("imports group.xml", () => {
    const yaml = convert("group.xml", "PredefinedItemCollection").yaml
    expect(yaml).toHaveProperty("Значение.Группа.Код", "000000003")
    expect(yaml).toHaveProperty("Значение.Группа.Элементы.Предопределенный1")
  })

  it("imports item.xml", () => {
    expect(convert("item.xml", "PredefinedItemCollection").yaml).toHaveProperty(
      "Значение.Предопределенный2.Наименование",
      "Наименование"
    )
  })

  it("imports typed-code.xml", () => {
    expect(convert("typed-code.xml", "PredefinedItemCollection").yaml).toHaveProperty(
      "Значение.Группа.Элементы.СтроковыйКод.Код",
      "0"
    )
  })

  it("imports Type for chart of characteristic types predefined item", () => {
    const yaml = testPropertyFromXMLToYAML({
      rule: collectionRule,
      xml: importContentFromXML<Record<string, unknown>>(TYPE_XML),
    }).yaml
    expect(yaml).toHaveProperty("Значение.ПредопределенноеВсеСвойства.ТипЗначения", "Строка(10)")
  })

  it.each(fixtures)("round-trip: %s", (fixture) => {
    const result = convert(fixture, "PredefinedItem")
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("exports undefined", () => {
    expect(testPropertyFromXMLToYAML({ rule: collectionRule, xml: {} }).yaml).toEqual({})
  })

  it.each(["group.xml", "item.xml"])("exports $name fixture", (fixture) => {
    expect(convert(fixture, "PredefinedItemCollection").yaml).toHaveProperty("Значение")
  })

  it("exports ТипЗначения for non-folder items and hides it for folders", () => {
    const item = testPropertyFromXMLToYAML({
      rule: collectionRule,
      xml: importContentFromXML<Record<string, unknown>>(TYPE_XML),
    }).yaml
    const group = convert("group.xml", "PredefinedItemCollection").yaml
    expect(item).toHaveProperty("Значение.ПредопределенноеВсеСвойства.ТипЗначения", "Строка(10)")
    expect(group).not.toHaveProperty("Значение.Группа.ТипЗначения")
  })

  it("не помечает канонические префиксы Type на глубинах 1–4", () => {
    const contexts = createDirectRoundTripContexts()
    const yaml = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule: collectionRule,
      xml: {
        Item: predefinedItem("Первый", "d4p1", "CatalogRef.Товары", {
          Item: predefinedItem("Второй", "d6p1", "CatalogRef.Товары", {
            Item: predefinedItem("Третий", "d8p1", "CatalogRef.Товары", {
              Item: predefinedItem("Четвертый", "d10p1", "CatalogRef.Товары"),
            }),
          }),
        }),
      },
    }).yaml as Record<string, any>

    const first = yaml.Значение.Первый
    const second = first.Элементы.Второй
    const third = second.Элементы.Третий
    const fourth = third.Элементы.Четвертый
    for (const item of [first, second, third, fourth]) {
      expect(item.ТипЗначения).toBe("Справочник.Товары")
      expect(yamlScalarTagAt(item, "ТипЗначения")).toBeUndefined()
    }
  })

  it("сохраняет неканонический префикс предопределённого элемента через !xml", () => {
    const yaml = testPropertyFromXMLToYAML({
      rule: collectionRule,
      xml: { Item: predefinedItem("Первый", "d6p1", "CatalogRef.Товары") },
    }).yaml as Record<string, any>
    const item = yaml.Значение.Первый

    expect(item.ТипЗначения).toBe("!xml/type d6p1:Справочник.Товары")
    expect(yamlScalarTagAt(item, "ТипЗначения")).toBe("xml/type")
  })

  it("точно восстанавливает неканонический d6p1 у Type на глубине 1", () => {
    const source = { Item: predefinedItem("Первый", "d6p1", "CatalogRef.Товары") }
    const { yaml, xml } = roundTrip(source)
    const item = (yaml as Record<string, any>).Значение.Первый

    expect(item.ТипЗначения).toBe("!xml/type d6p1:Справочник.Товары")
    expect(yamlScalarTagAt(item, "ТипЗначения")).toBe("xml/type")
    expect(xml).toMatchObject({
      Item: [{
        Type: {
          "v8:Type": {
            "_xmlns:d6p1": "http://v8.1c.ru/8.1/data/enterprise/current-config",
            "#text": "d6p1:CatalogRef.Товары",
          },
        },
      }],
    })
  })

  it("выбирает TypeSet по реестру без !xml и снимка", () => {
    const contexts = createDirectRoundTripContexts()
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule: collectionRule,
      xml: { Item: predefinedItem("Первый", "d4p1", "CatalogRef", undefined, "v8:TypeSet") },
    }).yaml as Record<string, any>
    const item = imported.Значение.Первый

    expect(item.ТипЗначения).toBe("Справочник")
    expect(yamlScalarTagAt(item, "ТипЗначения")).toBeUndefined()

    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(chartContext()),
      rule: collectionRule,
      yaml: imported,
    })
    expect(serializeDirectXML(exported.xml)).toContain("<v8:TypeSet")
  })

  it("точно восстанавливает канонический d4p1 у TypeSet", () => {
    const source = { Item: predefinedItem("Первый", "d4p1", "CatalogRef", undefined, "v8:TypeSet") }
    const { yaml, xml } = roundTrip(source)
    const item = (yaml as Record<string, any>).Значение.Первый

    expect(item.ТипЗначения).toBe("Справочник")
    expect(yamlScalarTagAt(item, "ТипЗначения")).toBeUndefined()
    expect(xml).toMatchObject({
      Item: [{
        Type: {
          "v8:TypeSet": {
            "_xmlns:d4p1": "http://v8.1c.ru/8.1/data/enterprise/current-config",
            "#text": "d4p1:CatalogRef",
          },
        },
      }],
    })
  })

  it("отклоняет несовместимый generated prefix внутри составного типа", () => {
    expect(() => importCompoundType("d7p1")).toThrow("несовместимый XML-префикс d7p1")
  })

  it("точно восстанавливает допустимый неканонический prefix внутри составного типа", () => {
    const source = compoundPredefinedItem("d6p1")
    const { yaml, xml } = roundTrip(source)
    const type = (yaml as Record<string, any>).Значение.Первый.ТипЗначения

    expect(type).toEqual(["!xml/type d6p1:Справочник.Товары", "Строка"])
    expect(yamlScalarTagAt(type, 0)).toBe("xml/type")
    expect(yamlScalarTagAt(type, 1)).toBeUndefined()
    expect(xml).toMatchObject({
      Item: [{
        Type: {
          "v8:Type": [
            {
              "_xmlns:d6p1": "http://v8.1c.ru/8.1/data/enterprise/current-config",
              "#text": "d6p1:CatalogRef.Товары",
            },
            "xs:string",
          ],
        },
      }],
    })
  })
})

function convert(fixture: string, propertyType: string) {
  return testPropertyFixtureThroughYAML({
    propertyType,
    xmlRootTag: "Item",
    importMetaUrl: import.meta.url,
    fixture,
  })
}

function probeRule(type: string): MetadataItemRule {
  return {
    itemType: `${type}Probe`,
    properties: { value: { type, yaml: "Значение", xml: "Item" } },
  } as MetadataItemRule
}

const normalize = (value: string): string =>
  value
    .replace(/^\uFEFF?<\?xml version="1\.0" encoding="UTF-8"\?>\r?\n/, "")
    .replace(/\r\n/g, "\n")
    .trim()

const TYPE_XML = `<Item><Name>ПредопределенноеВсеСвойства</Name><IsFolder>false</IsFolder><Code>000000001</Code><Description>Предопределенное все свойства</Description><Type><v8:Type>xs:string</v8:Type><v8:StringQualifiers><v8:Length>10</v8:Length><v8:AllowedLength>Variable</v8:AllowedLength></v8:StringQualifiers></Type></Item>`

function predefinedItem(
  name: string,
  prefix: string,
  type: string,
  childItems?: Record<string, unknown>,
  container: "v8:Type" | "v8:TypeSet" = "v8:Type",
): Record<string, unknown> {
  return {
    Name: name,
    Code: "",
    Description: "",
    IsFolder: false,
    Type: {
      [container]: {
        [`_xmlns:${prefix}`]: "http://v8.1c.ru/8.1/data/enterprise/current-config",
        "#text": `${prefix}:${type}`,
      },
    },
    ...(childItems === undefined ? {} : { ChildItems: childItems }),
  }
}

function roundTrip(source: Record<string, unknown>) {
  const contexts = createDirectRoundTripContexts()
  const imported = testPropertyFromXMLToYAML({
    context: contexts.importContext,
    rule: collectionRule,
    xml: source,
  })
  const exported = testPropertyFromYAMLToXML({
    context: contexts.exportContext(chartContext()),
    rule: collectionRule,
    yaml: imported.yaml,
  })
  return { yaml: imported.yaml, xml: exported.xml }
}

function chartContext() {
  const context = mockContextToXML()
  context.exportToXML.itemsTree.push({
    itemType: "MetadataChartOfCharacteristicTypes",
    name: "ВидыСубконто",
    path: "MetadataChartOfCharacteristicTypes.ВидыСубконто",
  })
  return context
}

function importCompoundType(prefix: string) {
  return testPropertyFromXMLToYAML({
    context: createDirectRoundTripContexts().importContext,
    rule: collectionRule,
    xml: compoundPredefinedItem(prefix),
  })
}

function compoundPredefinedItem(prefix: string): Record<string, unknown> {
  return {
    Item: {
      Name: "Первый",
      Code: "",
      Description: "",
      IsFolder: false,
      Type: {
        "v8:Type": [
          {
            [`_xmlns:${prefix}`]: "http://v8.1c.ru/8.1/data/enterprise/current-config",
            "#text": `${prefix}:CatalogRef.Товары`,
          },
          "xs:string",
        ],
        "v8:StringQualifiers": {
          "v8:Length": 0,
          "v8:AllowedLength": "Variable",
        },
      },
    },
  }
}
