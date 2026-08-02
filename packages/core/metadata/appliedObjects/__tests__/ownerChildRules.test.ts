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
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import {
  MetadataDocumentAttributeRules,
  MetadataDocumentTabularSectionAttributeRules,
  MetadataDocumentTabularSectionRules,
} from "../metadataDocument/childRules"
import { MetadataDocumentRules } from "../metadataDocument/rules"
import {
  MetadataTaskAttributeRules,
  MetadataTaskTabularSectionAttributeRules,
  MetadataTaskTabularSectionRules,
} from "../metadataTask/childRules"
import { MetadataTaskRules } from "../metadataTask/rules"
import {
  MetadataBusinessProcessAttributeRules,
  MetadataBusinessProcessTabularSectionAttributeRules,
  MetadataBusinessProcessTabularSectionRules,
} from "../metadataBusinessProcess/childRules"
import { MetadataBusinessProcessRules } from "../metadataBusinessProcess/rules"
import {
  MetadataExchangePlanAttributeRules,
  MetadataExchangePlanTabularSectionAttributeRules,
  MetadataExchangePlanTabularSectionRules,
} from "../metadataExchangePlan/childRules"
import { MetadataExchangePlanRules } from "../metadataExchangePlan/rules"
import {
  MetadataChartOfAccountsAttributeRules,
  MetadataChartOfAccountsTabularSectionAttributeRules,
  MetadataChartOfAccountsTabularSectionRules,
} from "../metadataChartOfAccounts/childRules"
import { MetadataChartOfAccountsRules } from "../metadataChartOfAccounts/rules"
import {
  MetadataChartOfCalculationTypesAttributeRules,
  MetadataChartOfCalculationTypesTabularSectionAttributeRules,
  MetadataChartOfCalculationTypesTabularSectionRules,
} from "../metadataChartOfCalculationTypes/childRules"
import { MetadataChartOfCalculationTypesRules } from "../metadataChartOfCalculationTypes/rules"
import {
  MetadataChartOfCharacteristicTypesAttributeRules,
  MetadataChartOfCharacteristicTypesTabularSectionAttributeRules,
  MetadataChartOfCharacteristicTypesTabularSectionRules,
} from "../metadataChartOfCharacteristicTypes/childRules"
import { MetadataChartOfCharacteristicTypesRules } from "../metadataChartOfCharacteristicTypes/rules"
import {
  MetadataDataProcessorAttributeRules,
  MetadataDataProcessorTabularSectionAttributeRules,
  MetadataDataProcessorTabularSectionRules,
} from "../metadataDataProcessor/childRules"
import { MetadataDataProcessorRules } from "../metadataDataProcessor/rules"
import {
  MetadataReportAttributeRules,
  MetadataReportTabularSectionAttributeRules,
  MetadataReportTabularSectionRules,
} from "../metadataReport/childRules"
import { MetadataReportRules } from "../metadataReport/rules"
import {
  MetadataInformationRegisterAttributeRules,
  MetadataInformationRegisterDimensionRules,
  MetadataInformationRegisterResourceRules,
} from "../metadataInformationRegister/childRules"
import { MetadataInformationRegisterRules } from "../metadataInformationRegister/rules"
import {
  MetadataAccumulationRegisterAttributeRules,
  MetadataAccumulationRegisterDimensionRules,
  MetadataAccumulationRegisterResourceRules,
} from "../metadataAccumulationRegister/childRules"
import { MetadataAccumulationRegisterRules } from "../metadataAccumulationRegister/rules"
import {
  MetadataAccountingRegisterAttributeRules,
  MetadataAccountingRegisterDimensionRules,
  MetadataAccountingRegisterResourceRules,
} from "../metadataAccountingRegister/childRules"
import { MetadataAccountingRegisterRules } from "../metadataAccountingRegister/rules"
import {
  MetadataCalculationRegisterAttributeRules,
  MetadataCalculationRegisterDimensionRules,
  MetadataCalculationRegisterResourceRules,
} from "../metadataCalculationRegister/childRules"
import { MetadataCalculationRegisterRules } from "../metadataCalculationRegister/rules"

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
const processingAttributeOrder = [...identity, ...presentation, ...choice, "uuid"]
const processingTabularOrder = [...tabularBase, "attributes", "uuid"]
const processingNestedOrder = [...identity, ...presentation, ...fill, ...choice, "uuid"]
const nestedAttribute = [...identity, ...presentation, ...choice, ...searchAndHistory, "uuid"]

const owners: readonly {
  name: string
  attributeType: string
  tabularType: string
  nestedType: string
  ownerRule: MetadataItemRule
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
    ownerRule: MetadataCatalogRules,
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
    ownerRule: MetadataDocumentRules,
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
    ownerRule: MetadataTaskRules,
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
    ownerRule: MetadataBusinessProcessRules,
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
    ownerRule: MetadataExchangePlanRules,
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
    ownerRule: MetadataChartOfAccountsRules,
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
    ownerRule: MetadataChartOfCalculationTypesRules,
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
    ownerRule: MetadataChartOfCharacteristicTypesRules,
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
    ownerRule: MetadataDataProcessorRules,
    attributeRule: MetadataDataProcessorAttributeRules,
    tabularRule: MetadataDataProcessorTabularSectionRules,
    nestedRule: MetadataDataProcessorTabularSectionAttributeRules,
    attributeOrder: processingAttributeOrder,
    tabularOrder: processingTabularOrder,
    nestedOrder: processingNestedOrder,
    topAllowedTypes: false,
    processingContract: true,
  },
  {
    name: "Report",
    attributeType: "MetadataReportAttributes",
    tabularType: "MetadataReportTabularSections",
    nestedType: "MetadataReportTabularSectionAttributes",
    ownerRule: MetadataReportRules,
    attributeRule: MetadataReportAttributeRules,
    tabularRule: MetadataReportTabularSectionRules,
    nestedRule: MetadataReportTabularSectionAttributeRules,
    attributeOrder: processingAttributeOrder,
    tabularOrder: processingTabularOrder,
    nestedOrder: processingNestedOrder,
    topAllowedTypes: false,
    processingContract: true,
  },
]

describe("owner-specific attribute and tabular section rules", () => {
  it("передаёт правила дочерних объектов справочника непосредственно в свойства", () => {
    expect(MetadataCatalogRules.properties.attributes.itemRule).toBe(
      MetadataCatalogAttributeRules
    )
    expect(MetadataCatalogRules.properties.tabularSections.itemRule).toBe(
      MetadataCatalogTabularSectionRules
    )
    expect(MetadataCatalogTabularSectionRules.properties.attributes.itemRule).toBe(
      MetadataCatalogTabularSectionAttributeRules
    )
  })

  it.each(owners)("keeps exact child contracts for $name", (owner) => {
    expectRuleOrder(owner.attributeRule, owner.attributeOrder)
    expectRuleOrder(owner.tabularRule, owner.tabularOrder)
    expectRuleOrder(owner.nestedRule, owner.nestedOrder ?? nestedAttribute)
    expect(owner.attributeRule.properties.type.allowedTypes !== undefined).toBe(owner.topAllowedTypes)
    expect(owner.nestedRule.properties.type.allowedTypes).toBeDefined()
    expect(owner.tabularRule.properties.attributes.operationTarget).toMatchObject({
      kind: "namedCollectionTarget",
      migrationSegment: "Реквизит",
      requiresMigration: true,
    })

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

    expect(owner.ownerRule.properties.attributes.itemRule).toBe(owner.attributeRule)
    expect(owner.ownerRule.properties.tabularSections.itemRule).toBe(owner.tabularRule)
    expect(owner.tabularRule.properties.attributes.itemRule).toBe(owner.nestedRule)
    expect(getTypeRule(owner.attributeType, "yamlToXMLNestedRule")).toBeDefined()
    expect(getTypeRule(owner.tabularType, "yamlToXMLNestedRule")).toBeDefined()
    expect(getTypeRule(owner.nestedType, "yamlToXMLNestedRule")).toBeDefined()

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
    ownerRule: MetadataInformationRegisterRules,
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
    ownerRule: MetadataAccumulationRegisterRules,
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
    ownerRule: MetadataAccountingRegisterRules,
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
    ownerRule: MetadataCalculationRegisterRules,
    rule: MetadataCalculationRegisterAttributeRules,
    order: [...identity, ...presentation, ...choice, "scheduleLink", "indexing", "fullTextSearch", "binaryDataStorageLocationUse", "uuid"],
    allowFill: false,
    allowHistory: false,
    allowBinaryField: false,
    allowSchedule: true,
  },
] as const

describe("owner-specific register attribute rules", () => {
  it("передаёт правила полей регистра сведений непосредственно в свойства", () => {
    expect(MetadataInformationRegisterRules.properties.attributes.itemRule).toBe(
      MetadataInformationRegisterAttributeRules
    )
    expect(MetadataInformationRegisterRules.properties.dimensions.itemRule).toBe(
      MetadataInformationRegisterDimensionRules
    )
    expect(MetadataInformationRegisterRules.properties.resources.itemRule).toBe(
      MetadataInformationRegisterResourceRules
    )
  })

  it.each(registerOwners)("keeps exact attribute contract for $name", (owner) => {
    expectRuleOrder(owner.rule, owner.order)
    expect(owner.ownerRule.properties.attributes.itemRule).toBe(owner.rule)
    expect(getTypeRule(owner.propertyType, "yamlToXMLNestedRule")).toBeDefined()

    const schema = compileValidationSchema(exportMetadataItemToJSONSchema({ context, rule: owner.rule }))
    expect(schema.Check({ Тип: "Строка", ЗаполнятьИзДанныхЗаполнения: "Истина" })).toBe(owner.allowFill)
    expect(schema.Check({ Тип: "Строка", ИсторияДанных: "Использовать" })).toBe(owner.allowHistory)
    expect(schema.Check({ Тип: "Строка", ПолеИспользованияХраненияВХранилищеДвоичныхДанных: "Поле" })).toBe(owner.allowBinaryField)
    expect(schema.Check({ Тип: "Строка", СвязьСГрафиком: "График" })).toBe(owner.allowSchedule)
  })
})

const registerDimensionOwners = [
  {
    name: "InformationRegister",
    propertyType: "MetadataInformationRegisterDimensions",
    ownerRule: MetadataInformationRegisterRules,
    rule: MetadataInformationRegisterDimensionRules,
    allowFill: true,
    allowHistory: true,
  },
  {
    name: "AccumulationRegister",
    propertyType: "MetadataAccumulationRegisterDimensions",
    ownerRule: MetadataAccumulationRegisterRules,
    rule: MetadataAccumulationRegisterDimensionRules,
    allowFill: false,
    allowHistory: false,
  },
  {
    name: "AccountingRegister",
    propertyType: "MetadataAccountingRegisterDimensions",
    ownerRule: MetadataAccountingRegisterRules,
    rule: MetadataAccountingRegisterDimensionRules,
    allowFill: false,
    allowHistory: false,
  },
  {
    name: "CalculationRegister",
    propertyType: "MetadataCalculationRegisterDimensions",
    ownerRule: MetadataCalculationRegisterRules,
    rule: MetadataCalculationRegisterDimensionRules,
    allowFill: false,
    allowHistory: false,
  },
] as const

describe("owner-specific register dimension rules", () => {
  it.each(registerDimensionOwners)("keeps exact dimension contract for $name", (owner) => {
    expect(owner.ownerRule.properties.dimensions.itemRule).toBe(owner.rule)
    expect(getTypeRule(owner.propertyType, "yamlToXMLNestedRule")).toBeDefined()
    const schema = compileValidationSchema(exportMetadataItemToJSONSchema({ context, rule: owner.rule }))

    expect(schema.Check({ Тип: "Строка", Индексирование: "НеИндексировать" })).toBe(true)
    expect(schema.Check({ Тип: "Строка", ЗаполнятьИзДанныхЗаполнения: "Истина" })).toBe(owner.allowFill)
    expect(schema.Check({ Тип: "Строка", ЗначениеЗаполнения: "Строка" })).toBe(owner.allowFill)
    expect(schema.Check({ Тип: "Строка", ИсторияДанных: "Использовать" })).toBe(owner.allowHistory)
  })
})

const registerResourceOwners = [
  {
    name: "InformationRegister",
    propertyType: "MetadataInformationRegisterResources",
    ownerRule: MetadataInformationRegisterRules,
    rule: MetadataInformationRegisterResourceRules,
    allowDefaults: true,
  },
  {
    name: "AccumulationRegister",
    propertyType: "MetadataAccumulationRegisterResources",
    ownerRule: MetadataAccumulationRegisterRules,
    rule: MetadataAccumulationRegisterResourceRules,
    allowDefaults: false,
  },
  {
    name: "AccountingRegister",
    propertyType: "MetadataAccountingRegisterResources",
    ownerRule: MetadataAccountingRegisterRules,
    rule: MetadataAccountingRegisterResourceRules,
    allowDefaults: false,
  },
  {
    name: "CalculationRegister",
    propertyType: "MetadataCalculationRegisterResources",
    ownerRule: MetadataCalculationRegisterRules,
    rule: MetadataCalculationRegisterResourceRules,
    allowDefaults: false,
  },
] as const

describe("owner-specific register resource rules", () => {
  it.each(registerResourceOwners)("keeps exact resource contract for $name", (owner) => {
    expect(owner.ownerRule.properties.resources.itemRule).toBe(owner.rule)
    expect(getTypeRule(owner.propertyType, "yamlToXMLNestedRule")).toBeDefined()
    const schema = compileValidationSchema(exportMetadataItemToJSONSchema({ context, rule: owner.rule }))

    for (const value of [
      { ЗаполнятьИзДанныхЗаполнения: "Истина" },
      { ЗначениеЗаполнения: "Строка" },
      { Индексирование: "НеИндексировать" },
      { ИсторияДанных: "Использовать" },
    ]) {
      expect(schema.Check({ Тип: "Строка", ...value })).toBe(owner.allowDefaults)
    }
  })
})

it.each(["MetadataAttributes", "MetadataAttributesWithAllowedTypes", "MetadataTabularSections", "MetadataTabularSectionAttributes", "MetadataTabularSectionAttributesWithFill"])(
  "registers generic child profile %s as fallback",
  (propertyType) => {
    expect(getTypeRule(propertyType, "collectionItemRule")).toBeDefined()
  }
)

it.each(["MetadataRegisterAttributes", "MetadataRegisterDimensions", "MetadataRegisterResources"])(
  "registers generic register child profile %s as fallback",
  (propertyType) => {
    expect(getTypeRule(propertyType, "collectionItemRule")).toBeDefined()
  }
)

function expectRuleOrder(rule: MetadataItemRule, expected: readonly string[]): void {
  if (rule.xmlOrder === undefined) throw new Error(`У ${rule.itemType} отсутствует xmlOrder`)
  expect(rule.xmlOrder).toEqual(expected)
  expect(Object.keys(rule.properties)).toEqual(expected)
  expect(getCompiledXMLPropertyOrder(rule)).toEqual(rule.xmlOrder)
  expect(new Set(rule.xmlOrder).size).toBe(rule.xmlOrder.length)
}
