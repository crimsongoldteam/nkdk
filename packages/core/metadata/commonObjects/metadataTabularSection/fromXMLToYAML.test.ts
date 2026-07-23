import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML, testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { importContentFromXML } from "../../../xml/import/importer"

import "./register"

const rule = probeRule("MetadataTabularSections")

describe("MetadataTabularSections XML → YAML", () => {
  it("should import full", () => {
    const yaml = convert("full.xml").yaml
    expect(yaml).toHaveProperty("Значение.ТабличнаяЧастьПолный.Комментарий", "Комментарий")
    expect(yaml).toHaveProperty("Значение.ТабличнаяЧастьПолный.ДлинаНомераСтроки", 7)
    expect(yaml).toHaveProperty("Значение.ТабличнаяЧастьПолный.Реквизиты.Реквизит1.Тип", "Строка(10)")
  })

  it("should import minimal", () => {
    expect(convert("minimal.xml").yaml).toEqual({
      Значение: { ТабличнаяЧастьМинимальный: { ДлинаНомераСтроки: 9 } },
    })
  })

  it("imports explicit empty Synonym as empty i18n text", () => {
    const result = testPropertyFromXMLToYAML({
      rule,
      xml: importContentFromXML(INLINE_XML),
    }).yaml
    expect(result).toEqual({ Значение: { Исполнители: {} } })
  })

  it("should return undefined when data is undefined", () => {
    expect(testPropertyFromXMLToYAML({ rule, xml: {} }).yaml).toEqual({})
  })

  it("should export full", () => {
    expect(convert("full.xml").yaml).toHaveProperty("Значение.ТабличнаяЧастьПолный")
  })

  it("should export minimal", () => {
    expect(convert("minimal.xml").yaml).toHaveProperty("Значение.ТабличнаяЧастьМинимальный")
  })
})

const convert = (fixture: string) =>
  testPropertyFixtureThroughYAML({
    propertyType: "MetadataTabularSections",
    xmlRootTag: "TabularSection",
    importMetaUrl: import.meta.url,
    fixture,
  })

function probeRule(type: string): MetadataItemRule {
  return {
    itemType: `${type}Probe`,
    properties: { value: { type, yaml: "Значение", xml: "TabularSection" } },
  } as MetadataItemRule
}

export const INLINE_XML = `<TabularSection uuid="3cf6b85b-5422-44cc-bb0a-11d41703d9f5"><Properties><Name>Исполнители</Name><Synonym/><Comment/><ToolTip/><FillChecking>DontCheck</FillChecking><Use>ForItem</Use><LineNumberLength>5</LineNumberLength></Properties><ChildObjects/></TabularSection>`
