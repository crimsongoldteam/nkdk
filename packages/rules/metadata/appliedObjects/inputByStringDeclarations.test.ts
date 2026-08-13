import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import type { InputByStringFieldsWidePropertyRule } from "../commonObjects/inputByStringFields/types"
import type { NumberPropertyRule } from "../commonObjects/number/types"
import { MetadataExternalDataSourceTableRules } from "../commonObjects/metadataExternalDataSourceTable/rules"
import { inputByStringObjectRules } from "./inputByStringObjectRules"

const objectRule = (itemType: string): MetadataItemRule => {
  const rule = inputByStringObjectRules.find((candidate) => candidate.itemType === itemType)
  if (rule === undefined) throw new Error(`Не найдено правило ${itemType}`)
  return rule
}

const MetadataBusinessProcessRules = objectRule("MetadataBusinessProcess")
const MetadataCatalogRules = objectRule("MetadataCatalog")
const MetadataChartOfAccountsRules = objectRule("MetadataChartOfAccounts")
const MetadataChartOfCalculationTypesRules = objectRule("MetadataChartOfCalculationTypes")
const MetadataChartOfCharacteristicTypesRules = objectRule("MetadataChartOfCharacteristicTypes")
const MetadataDocumentRules = objectRule("MetadataDocument")
const MetadataDocumentNumeratorRules = objectRule("MetadataDocumentNumerator")
const MetadataExchangePlanRules = objectRule("MetadataExchangePlan")
const MetadataTaskRules = objectRule("MetadataTask")

const conditional = (propertyKey: string) => ({ propertyKey, equals: "Number", maximum: 38 })

const lengthCases = [
  [MetadataExchangePlanRules, "codeLength", 1, 50, undefined],
  [MetadataExchangePlanRules, "descriptionLength", 1, 250, undefined],
  [MetadataCatalogRules, "codeLength", 0, 50, conditional("codeType")],
  [MetadataCatalogRules, "descriptionLength", 0, 150, undefined],
  [MetadataDocumentRules, "numberLength", 0, 50, conditional("numberType")],
  [MetadataDocumentNumeratorRules, "numberLength", 0, 50, conditional("numberType")],
  [MetadataChartOfCharacteristicTypesRules, "codeLength", 0, 50, undefined],
  [MetadataChartOfCharacteristicTypesRules, "descriptionLength", 0, 150, undefined],
  [MetadataChartOfAccountsRules, "codeLength", 0, 628, undefined],
  [MetadataChartOfAccountsRules, "descriptionLength", 0, 628, undefined],
  [MetadataChartOfCalculationTypesRules, "codeLength", 0, 40, conditional("codeType")],
  [MetadataChartOfCalculationTypesRules, "descriptionLength", 0, 100, undefined],
  [MetadataBusinessProcessRules, "numberLength", 0, 50, conditional("numberType")],
  [MetadataTaskRules, "numberLength", 0, 50, conditional("numberType")],
  [MetadataTaskRules, "descriptionLength", 0, 150, undefined],
] as const

const inputCases = [
  [MetadataCatalogRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [MetadataDocumentRules, ["СтандартныйРеквизит.Номер"]],
  [MetadataExchangePlanRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [MetadataChartOfCharacteristicTypesRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [MetadataChartOfAccountsRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [MetadataChartOfCalculationTypesRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Код"]],
  [MetadataBusinessProcessRules, ["СтандартныйРеквизит.Номер"]],
  [MetadataTaskRules, ["СтандартныйРеквизит.Наименование", "СтандартныйРеквизит.Номер"]],
] as const

describe("applied object length declarations", () => {
  it.each(lengthCases)("declares exact bounds for $itemType.$1", (itemRule, propertyKey, minimum, maximum, maximumWhen) => {
    const rule = (itemRule as MetadataItemRule).properties[propertyKey] as NumberPropertyRule
    expect(rule).toMatchObject({ type: "number", minimum, maximum })
    expect(rule.maximumWhen).toEqual(maximumWhen)
    if (maximumWhen !== undefined) {
      expect(rule.description).toContain("При значении Число максимальная длина — 38.")
    }
  })
})

describe("input by string declarations", () => {
  it.each(inputCases)("declares exact standard field order for $itemType", (itemRule, expected) => {
    const rule = itemRule.properties.inputByString as InputByStringFieldsWidePropertyRule
    expect(rule.type).toBe("InputByStringFields")
    expect(rule.standardFields.map(({ yaml }) => yaml)).toEqual(expected)
  })

  it("does not change external data source tables", () => {
    expect((MetadataExternalDataSourceTableRules as MetadataItemRule).properties.inputByString.type)
      .not.toBe("InputByStringFields")
  })
})
