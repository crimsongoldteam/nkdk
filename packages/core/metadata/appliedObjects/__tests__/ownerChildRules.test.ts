import { describe, expect, it } from "vitest"

import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "../../orchestration/property/types"
import {
  MetadataCatalogAttributeRules,
  MetadataCatalogTabularSectionAttributeRules,
  MetadataCatalogTabularSectionRules,
} from "../metadataCatalog/childRules"
import {
  MetadataDocumentAttributeRules,
  MetadataDocumentTabularSectionAttributeRules,
  MetadataDocumentTabularSectionRules,
} from "../metadataDocument/childRules"
import {
  MetadataTaskAttributeRules,
  MetadataTaskTabularSectionAttributeRules,
  MetadataTaskTabularSectionRules,
} from "../metadataTask/childRules"
import {
  MetadataBusinessProcessAttributeRules,
  MetadataBusinessProcessTabularSectionAttributeRules,
  MetadataBusinessProcessTabularSectionRules,
} from "../metadataBusinessProcess/childRules"
import {
  MetadataExchangePlanAttributeRules,
  MetadataExchangePlanTabularSectionAttributeRules,
  MetadataExchangePlanTabularSectionRules,
} from "../metadataExchangePlan/childRules"
import {
  MetadataChartOfAccountsAttributeRules,
  MetadataChartOfAccountsTabularSectionAttributeRules,
  MetadataChartOfAccountsTabularSectionRules,
} from "../metadataChartOfAccounts/childRules"
import {
  MetadataChartOfCalculationTypesAttributeRules,
  MetadataChartOfCalculationTypesTabularSectionAttributeRules,
  MetadataChartOfCalculationTypesTabularSectionRules,
} from "../metadataChartOfCalculationTypes/childRules"
import {
  MetadataChartOfCharacteristicTypesAttributeRules,
  MetadataChartOfCharacteristicTypesTabularSectionAttributeRules,
  MetadataChartOfCharacteristicTypesTabularSectionRules,
} from "../metadataChartOfCharacteristicTypes/childRules"

const context = { defaultLanguage: "ru", version: "2.20" } as const
const identity = ["objectBelonging", "name"]
const presentation = [
  "synonym",
  "comment",
  "type",
  "passwordMode",
  "format",
  "editFormat",
  "toolTip",
  "markNegatives",
  "mask",
  "multiLine",
  "extendedEdit",
  "minValue",
  "maxValue",
]
const fill = ["fillFromFillingValue", "fillValue"]
const choice = [
  "fillChecking",
  "choiceFoldersAndItems",
  "choiceParameterLinks",
  "choiceParameters",
  "quickChoice",
  "createOnInput",
  "choiceForm",
  "linkByType",
  "choiceHistoryOnInput",
]
const searchAndHistory = ["indexing", "fullTextSearch", "dataHistory"]
const tabularBase = [
  "internalInfo",
  "objectBelonging",
  "name",
  "synonym",
  "comment",
  "toolTip",
  "fillChecking",
  "standardAttributes",
]
const nestedAttribute = [...identity, ...presentation, ...choice, ...searchAndHistory, "uuid"]

const owners: readonly {
  name: string
  attributeType: string
  tabularType: string
  nestedType: string
  attributeRule: MetadataItemRule
  tabularRule: MetadataItemRule
  nestedRule: MetadataItemRule
  attributeOrder: readonly string[]
  tabularOrder: readonly string[]
  topAllowedTypes: boolean
  allowUse?: boolean
}[] = [
  {
    name: "Catalog",
    attributeType: "MetadataCatalogAttributes",
    tabularType: "MetadataCatalogTabularSections",
    nestedType: "MetadataCatalogTabularSectionAttributes",
    attributeRule: MetadataCatalogAttributeRules,
    tabularRule: MetadataCatalogTabularSectionRules,
    nestedRule: MetadataCatalogTabularSectionAttributeRules,
    attributeOrder: [
      ...identity,
      ...presentation,
      ...fill,
      ...choice,
      "use",
      ...searchAndHistory,
      "binaryDataStorageLocationUse",
      "binaryDataStorageLocationUseField",
      "uuid",
    ],
    tabularOrder: [...tabularBase, "use", "lineNumberLength", "attributes", "uuid"],
    topAllowedTypes: true,
  },
  {
    name: "Document",
    attributeType: "MetadataDocumentAttributes",
    tabularType: "MetadataDocumentTabularSections",
    nestedType: "MetadataDocumentTabularSectionAttributes",
    attributeRule: MetadataDocumentAttributeRules,
    tabularRule: MetadataDocumentTabularSectionRules,
    nestedRule: MetadataDocumentTabularSectionAttributeRules,
    attributeOrder: [
      ...identity,
      ...presentation,
      ...fill,
      ...choice,
      ...searchAndHistory,
      "binaryDataStorageLocationUseField",
      "uuid",
    ],
    tabularOrder: [...tabularBase, "lineNumberLength", "attributes", "uuid"],
    topAllowedTypes: true,
  },
  {
    name: "Task",
    attributeType: "MetadataTaskAttributes",
    tabularType: "MetadataTaskTabularSections",
    nestedType: "MetadataTaskTabularSectionAttributes",
    attributeRule: MetadataTaskAttributeRules,
    tabularRule: MetadataTaskTabularSectionRules,
    nestedRule: MetadataTaskTabularSectionAttributeRules,
    attributeOrder: [...identity, ...presentation, ...fill, ...choice, ...searchAndHistory, "uuid"],
    tabularOrder: [...tabularBase, "lineNumberLength", "attributes", "uuid"],
    topAllowedTypes: false,
  },
  {
    name: "BusinessProcess",
    attributeType: "MetadataBusinessProcessAttributes",
    tabularType: "MetadataBusinessProcessTabularSections",
    nestedType: "MetadataBusinessProcessTabularSectionAttributes",
    attributeRule: MetadataBusinessProcessAttributeRules,
    tabularRule: MetadataBusinessProcessTabularSectionRules,
    nestedRule: MetadataBusinessProcessTabularSectionAttributeRules,
    attributeOrder: [...identity, ...presentation, ...fill, ...choice, ...searchAndHistory, "uuid"],
    tabularOrder: [...tabularBase, "lineNumberLength", "attributes", "uuid"],
    topAllowedTypes: false,
  },
  {
    name: "ExchangePlan",
    attributeType: "MetadataExchangePlanAttributes",
    tabularType: "MetadataExchangePlanTabularSections",
    nestedType: "MetadataExchangePlanTabularSectionAttributes",
    attributeRule: MetadataExchangePlanAttributeRules,
    tabularRule: MetadataExchangePlanTabularSectionRules,
    nestedRule: MetadataExchangePlanTabularSectionAttributeRules,
    attributeOrder: [
      ...identity,
      ...presentation,
      ...fill,
      ...choice,
      ...searchAndHistory,
      "binaryDataStorageLocationUseField",
      "uuid",
    ],
    tabularOrder: [...tabularBase, "lineNumberLength", "attributes", "uuid"],
    topAllowedTypes: true,
  },
  {
    name: "ChartOfAccounts",
    attributeType: "MetadataChartOfAccountsAttributes",
    tabularType: "MetadataChartOfAccountsTabularSections",
    nestedType: "MetadataChartOfAccountsTabularSectionAttributes",
    attributeRule: MetadataChartOfAccountsAttributeRules,
    tabularRule: MetadataChartOfAccountsTabularSectionRules,
    nestedRule: MetadataChartOfAccountsTabularSectionAttributeRules,
    attributeOrder: [...identity, ...presentation, ...fill, ...choice, ...searchAndHistory, "uuid"],
    tabularOrder: [...tabularBase, "lineNumberLength", "attributes", "uuid"],
    topAllowedTypes: false,
    allowUse: false,
  },
  {
    name: "ChartOfCalculationTypes",
    attributeType: "MetadataChartOfCalculationTypesAttributes",
    tabularType: "MetadataChartOfCalculationTypesTabularSections",
    nestedType: "MetadataChartOfCalculationTypesTabularSectionAttributes",
    attributeRule: MetadataChartOfCalculationTypesAttributeRules,
    tabularRule: MetadataChartOfCalculationTypesTabularSectionRules,
    nestedRule: MetadataChartOfCalculationTypesTabularSectionAttributeRules,
    attributeOrder: [...identity, ...presentation, ...fill, ...choice, ...searchAndHistory, "uuid"],
    tabularOrder: [...tabularBase, "lineNumberLength", "attributes", "uuid"],
    topAllowedTypes: false,
    allowUse: false,
  },
  {
    name: "ChartOfCharacteristicTypes",
    attributeType: "MetadataChartOfCharacteristicTypesAttributes",
    tabularType: "MetadataChartOfCharacteristicTypesTabularSections",
    nestedType: "MetadataChartOfCharacteristicTypesTabularSectionAttributes",
    attributeRule: MetadataChartOfCharacteristicTypesAttributeRules,
    tabularRule: MetadataChartOfCharacteristicTypesTabularSectionRules,
    nestedRule: MetadataChartOfCharacteristicTypesTabularSectionAttributeRules,
    attributeOrder: [...identity, ...presentation, ...fill, ...choice, "use", ...searchAndHistory, "uuid"],
    tabularOrder: [...tabularBase, "use", "lineNumberLength", "attributes", "uuid"],
    topAllowedTypes: true,
    allowUse: true,
  },
]

describe("owner-specific attribute and tabular section rules", () => {
  it.each(owners)("keeps exact child contracts for $name", (owner) => {
    expectRuleOrder(owner.attributeRule, owner.attributeOrder)
    expectRuleOrder(owner.tabularRule, owner.tabularOrder)
    expectRuleOrder(owner.nestedRule, nestedAttribute)
    expect(owner.attributeRule.properties.type.allowedTypes !== undefined).toBe(owner.topAllowedTypes)
    expect(owner.nestedRule.properties.type.allowedTypes).toBeDefined()

    if (owner.allowUse !== undefined) {
      const attributeSchema = compileValidationSchema(
        exportMetadataItemToJSONSchema({ context, rule: owner.attributeRule })
      )
      const tabularSchema = compileValidationSchema(
        exportMetadataItemToJSONSchema({ context, rule: owner.tabularRule })
      )
      expect(attributeSchema.Check({ Тип: "Строка", Использование: "ДляЭлемента" })).toBe(owner.allowUse)
      expect(tabularSchema.Check({ Использование: "ДляЭлемента" })).toBe(owner.allowUse)
    }

    expect(getTypeRule(owner.attributeType, "collectionItemRule")?.itemRule).toBe(owner.attributeRule)
    expect(getTypeRule(owner.tabularType, "collectionItemRule")?.itemRule).toBe(owner.tabularRule)
    expect(getTypeRule(owner.nestedType, "collectionItemRule")?.itemRule).toBe(owner.nestedRule)

    const nestedSchema = compileValidationSchema(
      exportMetadataItemToJSONSchema({ context, rule: owner.nestedRule })
    )
    expect(
      nestedSchema.Check({
        Тип: "Строка",
        ЗаполнятьИзДанныхЗаполнения: "Истина",
      })
    ).toBe(false)
  })
})

function expectRuleOrder(rule: MetadataItemRule, expected: readonly string[]): void {
  expect(rule.xmlOrder).toEqual(expected)
  expect(Object.keys(rule.properties)).toEqual(expected)
}
