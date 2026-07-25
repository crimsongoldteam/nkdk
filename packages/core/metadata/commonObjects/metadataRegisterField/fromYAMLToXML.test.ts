import { describe, expect, it } from "vitest"

import { serializeDirectXML, testMetadataItemFromYAMLToXML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "../accountingFlag/rules"

import "../accountingFlag/register"
import "../metadataRegisterDimension/register"
import "../metadataRegisterResource/register"

const dimensionsRule = collectionRule("MetadataRegisterDimensions", "Dimension")
const resourcesRule = collectionRule("MetadataRegisterResources", "Resource")

describe("metadata register field YAML → XML", () => {
  it.each([
    ["AccountingFlag", AccountingFlagRules],
    ["ExtDimensionAccountingFlag", ExtDimensionAccountingFlagRules],
  ] as const)("restores omitted synonym from name for %s", (_label, rule) => {
    const xml = exportItem(rule, "УчетПоПодразделениям", { Тип: "Булево" })
    expect(xml).toContain("<v8:content>Учет по подразделениям</v8:content>")
    expect(xml).toContain("<v8:Type>xs:boolean</v8:Type>")
  })

  it("exports explicit empty synonym for object YAML register field", () => {
    const xml = exportItem(AccountingFlagRules, "УдалитьОКТМО_КПП", {
      Синоним: "",
      Тип: "Строка(21)",
    })
    expect(xml).toContain("<Synonym/>")
    expect(xml).not.toContain("<v8:item>")
    expect(xml).toContain("<v8:Length>21</v8:Length>")
  })

  it.each([
    ["AccountingFlag", AccountingFlagRules],
    ["ExtDimensionAccountingFlag", ExtDimensionAccountingFlagRules],
  ] as const)("restores omitted synonym from name for object %s", (_label, rule) => {
    const xml = exportItem(rule, "ПризнакУчетаПоУмолчанию", { Тип: "Булево" })
    expect(xml).toContain("<v8:content>Признак учета по умолчанию</v8:content>")
  })

  it("rejects scalar YAML register field", () => {
    expect(() => exportItem(AccountingFlagRules, "ПризнакУчетаПоУмолчанию", "Булево")).toThrow(
      "AccountingFlag: ожидался YAML-объект"
    )
  })

  it("exports explicit empty synonym for object YAML register dimension collection", () => {
    expectExplicitEmptyCollectionSynonym(dimensionsRule, "УдалитьОКТМО_КПП", "Строка(21)")
  })

  it("exports explicit empty synonym for full YAML register resource collection", () => {
    expectExplicitEmptyCollectionSynonym(resourcesRule, "Содержание", "Строка(100)")
  })

  it("exports explicit empty synonym for full YAML register dimension collection", () => {
    expectExplicitEmptyCollectionSynonym(dimensionsRule, "Организация", "Булево")
  })

  it("restores omitted synonym from name for object YAML register resource collection without source", () => {
    expectGeneratedCollectionSynonym(resourcesRule, "Содержание", "Строка(100)", "Содержание")
  })

  it("restores omitted synonym from name for full YAML register resource collection without source", () => {
    expectGeneratedCollectionSynonym(resourcesRule, "Содержание", "Строка(100)", "Содержание")
  })

  it("restores omitted synonym from name for object YAML register dimension collection without source", () => {
    expectGeneratedCollectionSynonym(
      dimensionsRule,
      "Организация",
      "Булево",
      "Организация"
    )
  })

  it("restores omitted synonym from name for full YAML register dimension collection without source", () => {
    expectGeneratedCollectionSynonym(
      dimensionsRule,
      "Организация",
      "Булево",
      "Организация"
    )
  })
})

function collectionRule(type: string, xml: string): MetadataItemRule {
  return {
    itemType: `${type}Probe`,
    properties: { value: { type, yaml: "Значение", xml } },
  } as MetadataItemRule
}

function exportItem(rule: MetadataItemRule, name: string, yaml: unknown, referenceXML?: unknown): string {
  return serializeDirectXML(testMetadataItemFromYAMLToXML({ rule, name, yaml, referenceXML }).xml)
}

function expectExplicitEmptyCollectionSynonym(rule: MetadataItemRule, name: string, type: string): void {
  const xml = serializeDirectXML(
    testPropertyFromYAMLToXML({
      rule,
      yaml: { Значение: { [name]: { Синоним: "", Тип: type } } },
    }).xml
  )
  expect(xml).toContain("<Synonym/>")
  expect(xml).not.toContain("<v8:item>")
}

function expectGeneratedCollectionSynonym(
  rule: MetadataItemRule,
  name: string,
  type: string,
  synonym: string
): void {
  const xml = serializeDirectXML(
    testPropertyFromYAMLToXML({ rule, yaml: { Значение: { [name]: { Тип: type } } } }).xml
  )
  expect(xml).toContain(`<v8:content>${synonym}</v8:content>`)
}
