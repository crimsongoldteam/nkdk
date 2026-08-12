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

    expect(item.ТипЗначения).toBe("!xml d6p1:Справочник.Товары")
    expect(yamlScalarTagAt(item, "ТипЗначения")).toBe("xml")
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

    const exportBase = mockContextToXML()
    exportBase.exportToXML.itemsTree.push({
      itemType: "MetadataChartOfCharacteristicTypes",
      name: "ВидыСубконто",
      path: "MetadataChartOfCharacteristicTypes.ВидыСубконто",
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(exportBase),
      rule: collectionRule,
      yaml: imported,
    })
    expect(serializeDirectXML(exported.xml)).toContain("<v8:TypeSet")
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
