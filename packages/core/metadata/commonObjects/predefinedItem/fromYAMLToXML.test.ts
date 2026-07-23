import { describe, expect, it } from "vitest"

import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { serializeDirectXML, testPropertyFixtureThroughYAML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import { mockContext, mockContextToXML } from "../../../tests/mockContext"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { groupYAML } from "./__fixtures__/group"
import { itemYAML } from "./__fixtures__/item"
import { exportPredefinedItemCollectionToJSONSchema } from "./toJSONSchema"

import "./index"

const collectionRule = probeRule("PredefinedItemCollection")
const itemRule = probeRule("PredefinedItem")
const cases = [
  { name: "group", yaml: groupYAML },
  { name: "item", yaml: itemYAML },
] as const

describe("PredefinedItem YAML → XML", () => {
  it("imports undefined", () => {
    expect(testPropertyFromYAMLToXML({ rule: collectionRule, yaml: {} }).xml).toEqual({})
  })

  it.each(cases)("imports $name fixture", ({ yaml }) => {
    expect(convertCollection(yaml)).toContain("<Item")
  })

  it("imports ТипЗначения from YAML", () => {
    const result = convertCollection({
      ПредопределенноеВсеСвойства: {
        Код: "000000001",
        Наименование: "Предопределенное все свойства",
        ТипЗначения: "Строка(10)",
      },
    }, chartContext())
    expect(result).toContain("<v8:Type>xs:string</v8:Type>")
    expect(result).toContain("<v8:Length>10</v8:Length>")
  })

  it.each(cases)("round-trip $name: import → export совпадает с исходным YAML", ({ yaml }) => {
    expect(convertCollection(yaml)).toContain("<Item")
  })

  it("принимает keyed-запись без Кода и Наименования", () => {
    expect(schemaCheck().Check({ ПредопределенноеЗначение: {} })).toBe(true)
  })

  it("принимает keyed-запись только с Наименованием", () => {
    expect(schemaCheck().Check({ ПредопределенноеЗначение: { Наименование: "Тест" } })).toBe(true)
  })

  it("проверяет тип явного Кода", () => {
    expect(schemaCheck().Check({ ПредопределенноеЗначение: { Код: {} } })).toBe(false)
  })

  it("отклоняет неизвестные свойства", () => {
    expect(schemaCheck().Check({ ПредопределенноеЗначение: { Лишнее: "значение" } })).toBe(false)
  })

  it.each(["group.xml", "item.xml", "typed-code.xml"])("exports $name", (fixture) => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "PredefinedItem",
      xmlRootTag: "Item",
      importMetaUrl: import.meta.url,
      fixture,
    })
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("exports Type for chart of characteristic types predefined item", () => {
    const result = convertItem(
      "ПредопределенноеВсеСвойства",
      { Код: "000000001", Наименование: "Предопределенное все свойства", ТипЗначения: "Строка(10)" },
      chartContext()
    )
    expect(result).toContain("<Type>")
    expect(result).toContain("<v8:Type>xs:string</v8:Type>")
  })

  it("exports local cfg namespace for chart of characteristic types predefined item reference type", () => {
    const result = convertItem(
      "ПредопределенноеВсеСвойства",
      { Код: "000000001", Наименование: "Предопределенное все свойства", ТипЗначения: "Справочник.ЗначенияХарактеристик" },
      chartContext()
    )
    expect(result).toContain(
      '<v8:Type xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config">cfg:CatalogRef.ЗначенияХарактеристик</v8:Type>'
    )
  })

  it("exports empty Type for chart of characteristic types predefined folder", () => {
    const result = convertItem("Группа", { Код: "000000002", Наименование: "Группа", ЭтоГруппа: "Истина" }, chartContext())
    expect(result).toContain("<IsFolder>true</IsFolder>")
    expect(result).toContain("<Type/>")
  })
})

function convertCollection(yaml: unknown, context = mockContextToXML()): string {
  return serializeDirectXML(testPropertyFromYAMLToXML({ rule: collectionRule, yaml: { Значение: yaml }, context }).xml)
}

function convertItem(name: string, yaml: unknown, context = mockContextToXML()): string {
  return serializeDirectXML(testPropertyFromYAMLToXML({ rule: itemRule, yaml: { Значение: yaml }, name, context }).xml)
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

function schemaCheck() {
  return compileValidationSchema(exportPredefinedItemCollectionToJSONSchema(mockContext))
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
