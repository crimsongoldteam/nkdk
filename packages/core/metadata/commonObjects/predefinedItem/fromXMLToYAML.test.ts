import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML, testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import { importContentFromXML } from "../../../xml/import/importer"
import type { MetadataItemRule } from "../../orchestration/property/types"

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
