import { describe, expect, it } from "vitest"

import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { exportMetadataItemToJSONSchema } from "../../orchestration/metadataItem/toJSONSchema"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { getCompiledXMLPropertyOrder } from "../../orchestration/property/xmlPropertyOrder"
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
import {
  MetadataDataProcessorAttributeRules,
  MetadataDataProcessorTabularSectionAttributeRules,
  MetadataDataProcessorTabularSectionRules,
} from "../metadataDataProcessor/childRules"
import {
  MetadataReportAttributeRules,
  MetadataReportTabularSectionAttributeRules,
  MetadataReportTabularSectionRules,
} from "../metadataReport/childRules"
import { MetadataInformationRegisterAttributeRules } from "../metadataInformationRegister/childRules"
import { MetadataAccumulationRegisterAttributeRules } from "../metadataAccumulationRegister/childRules"
import { MetadataAccountingRegisterAttributeRules } from "../metadataAccountingRegister/childRules"
import { MetadataCalculationRegisterAttributeRules } from "../metadataCalculationRegister/childRules"

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
  nestedOrder?: readonly string[]
  topAllowedTypes: boolean
  allowUse?: boolean
  processingContract?: boolean
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
  {
    name: "DataProcessor",
    attributeType: "MetadataDataProcessorAttributes",
    tabularType: "MetadataDataProcessorTabularSections",
    nestedType: "MetadataDataProcessorTabularSectionAttributes",
    attributeRule: MetadataDataProcessorAttributeRules,
    tabularRule: MetadataDataProcessorTabularSectionRules,
    nestedRule: MetadataDataProcessorTabularSectionAttributeRules,
    attributeOrder: [...identity, ...presentation, ...choice, "uuid"],
    tabularOrder: [...tabularBase, "attributes", "uuid"],
    nestedOrder: [...identity, ...presentation, ...fill, ...choice, "uuid"],
    topAllowedTypes: false,
    processingContract: true,
  },
  {
    name: "Report",
    attributeType: "MetadataReportAttributes",
    tabularType: "MetadataReportTabularSections",
    nestedType: "MetadataReportTabularSectionAttributes",
    attributeRule: MetadataReportAttributeRules,
    tabularRule: MetadataReportTabularSectionRules,
    nestedRule: MetadataReportTabularSectionAttributeRules,
    attributeOrder: [...identity, ...presentation, ...choice, "uuid"],
    tabularOrder: [...tabularBase, "attributes", "uuid"],
    nestedOrder: [...identity, ...presentation, ...fill, ...choice, "uuid"],
    topAllowedTypes: false,
    processingContract: true,
  },
]

describe("owner-specific attribute and tabular section rules", () => {
  it.each(owners)("keeps exact child contracts for $name", (owner) => {
    expectRuleOrder(owner.attributeRule, owner.attributeOrder)
    expectRuleOrder(owner.tabularRule, owner.tabularOrder)
    expectRuleOrder(owner.nestedRule, owner.nestedOrder ?? nestedAttribute)
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
    ).toBe(owner.processingContract === true)

    if (owner.processingContract === true) {
      const attributeSchema = compileValidationSchema(
        exportMetadataItemToJSONSchema({ context, rule: owner.attributeRule })
      )
      const tabularSchema = compileValidationSchema(
        exportMetadataItemToJSONSchema({ context, rule: owner.tabularRule })
      )
      expect(attributeSchema.Check({ Тип: "Строка", ЗначениеЗаполнения: "Строка" })).toBe(false)
      expect(attributeSchema.Check({ Тип: "Строка", Индексирование: "НеИндексировать" })).toBe(false)
      expect(tabularSchema.Check({ ДлинаНомераСтроки: 5 })).toBe(false)
      expect(nestedSchema.Check({ Тип: "Строка", Индексирование: "НеИндексировать" })).toBe(false)
    }
  })
})

const registerOwners = [
  {
    name: "InformationRegister",
    propertyType: "MetadataInformationRegisterAttributes",
    rule: MetadataInformationRegisterAttributeRules,
    order: [...identity, ...presentation, ...fill, ...choice, ...searchAndHistory, "binaryDataStorageLocationUse", "binaryDataStorageLocationUseField", "uuid"],
    allowFill: true,
    allowHistory: true,
    allowBinaryField: true,
    allowSchedule: false,
  },
  {
    name: "AccumulationRegister",
    propertyType: "MetadataAccumulationRegisterAttributes",
    rule: MetadataAccumulationRegisterAttributeRules,
    order: [...identity, ...presentation, ...choice, "indexing", "fullTextSearch", "binaryDataStorageLocationUse", "uuid"],
    allowFill: false,
    allowHistory: false,
    allowBinaryField: false,
    allowSchedule: false,
  },
  {
    name: "AccountingRegister",
    propertyType: "MetadataAccountingRegisterAttributes",
    rule: MetadataAccountingRegisterAttributeRules,
    order: [...identity, ...presentation, ...choice, "indexing", "fullTextSearch", "binaryDataStorageLocationUse", "uuid"],
    allowFill: false,
    allowHistory: false,
    allowBinaryField: false,
    allowSchedule: false,
  },
  {
    name: "CalculationRegister",
    propertyType: "MetadataCalculationRegisterAttributes",
    rule: MetadataCalculationRegisterAttributeRules,
    order: [...identity, ...presentation, ...choice, "scheduleLink", "indexing", "fullTextSearch", "binaryDataStorageLocationUse", "uuid"],
    allowFill: false,
    allowHistory: false,
    allowBinaryField: false,
    allowSchedule: true,
  },
] as const

describe("owner-specific register attribute rules", () => {
  it.each(registerOwners)("keeps exact attribute contract for $name", (owner) => {
    expectRuleOrder(owner.rule, owner.order)
    expect(getTypeRule(owner.propertyType, "collectionItemRule")?.itemRule).toBe(owner.rule)

    const schema = compileValidationSchema(exportMetadataItemToJSONSchema({ context, rule: owner.rule }))
    expect(schema.Check({ Тип: "Строка", ЗаполнятьИзДанныхЗаполнения: "Истина" })).toBe(owner.allowFill)
    expect(schema.Check({ Тип: "Строка", ИсторияДанных: "Использовать" })).toBe(owner.allowHistory)
    expect(schema.Check({ Тип: "Строка", ПолеИспользованияХраненияВХранилищеДвоичныхДанных: "Поле" })).toBe(owner.allowBinaryField)
    expect(schema.Check({ Тип: "Строка", СвязьСГрафиком: "График" })).toBe(owner.allowSchedule)
  })
})

it.each(["MetadataAttributes", "MetadataAttributesWithAllowedTypes", "MetadataTabularSections", "MetadataTabularSectionAttributes", "MetadataTabularSectionAttributesWithFill", "MetadataRegisterAttributes"])(
  "does not register universal child profile %s",
  (propertyType) => {
    expect(getTypeRule(propertyType, "collectionItemRule")).toBeUndefined()
  }
)

function expectRuleOrder(rule: MetadataItemRule, expected: readonly string[]): void {
  if (rule.xmlOrder === undefined) throw new Error(`У ${rule.itemType} отсутствует xmlOrder`)
  expect(rule.xmlOrder).toEqual(expected)
  expect(Object.keys(rule.properties)).toEqual(expected)
  expect(getCompiledXMLPropertyOrder(rule)).toEqual(rule.xmlOrder)
  expect(new Set(rule.xmlOrder).size).toBe(rule.xmlOrder.length)
}
