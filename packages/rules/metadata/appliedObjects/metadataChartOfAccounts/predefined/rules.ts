import { booleanRule } from "../../../commonObjects/boolean/types"
import { PredefinedRules } from "../../../commonObjects/predefined/rules"
import { PredefinedItemRules } from "../../../commonObjects/predefinedItem/rules"
import { stringRule } from "../../../commonObjects/string/types"
import { defineMetadataItemCollectionRule } from "../../../ruleRuntime/metadataCollection/ruleFactory"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import {
  chartOfAccountsPredefinedAccountingFlagsRule,
  chartOfAccountsPredefinedExtDimensionTypesRule,
} from "../builders"
import { XML_PRESENT_TAG_VALUE } from "@nkdk/runtime"
import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"

export const PredefinedAccountingFlagRules = {
  itemType: "ChartOfAccountsPredefinedAccountingFlag",
  xmlOrder: [
    "value",
    "ref",
  ],
  properties: {
    ref: stringRule({ xml: "_ref", required: true }),
    value: booleanRule({ yaml: "Значение", xml: "#text", required: true }),
  },
} as const satisfies MetadataItemRule

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "ChartOfAccountsPredefinedAccountingFlags",
  itemRule: PredefinedAccountingFlagRules,
  xmlElement: "Flag",
  keyField: "ref",
})

export const PredefinedExtDimensionTypeRules = {
  itemType: "ChartOfAccountsPredefinedExtDimensionType",
  xmlOrder: [
    "turnover",
    "accountingFlags",
    "name",
  ],
  properties: {
    name: stringRule({ xml: "_name", required: true }),
    turnover: booleanRule({
      yaml: "Оборотный",
      xml: "Turnover",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    accountingFlags: chartOfAccountsPredefinedAccountingFlagsRule({
      yaml: "ПризнакиУчета",
      xml: "AccountingFlags",
      itemRule: PredefinedAccountingFlagRules,
    }),
  },
} as const satisfies MetadataItemRule

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "ChartOfAccountsPredefinedExtDimensionTypes",
  itemRule: PredefinedExtDimensionTypeRules,
  xmlElement: "ExtDimensionType",
  keyField: "name",
})

export const ChartOfAccountsPredefinedItemRules = {
  ...PredefinedItemRules,
  itemType: "ChartOfAccountsPredefinedItem",
  xmlOrder: [
    "name",
    "code",
    "description",
    "accountType",
    "offBalance",
    "order",
    "accountingFlags",
    "extDimensionTypes",
    "childItems",
    "id",
  ],
  properties: {
    ...PredefinedItemRules.properties,
    isFolder: {
      ...PredefinedItemRules.properties.isFolder,
      toXML: false,
    },
    accountType: systemEnumerationRule({
      yaml: "ВидСчета",
      xml: "AccountType",
      typeSE: "AccountType",
      defaultValueXML: "ActivePassive",
      implicitValueYAML: "ActivePassive",
    }),
    offBalance: booleanRule({
      yaml: "Забалансовый",
      xml: "OffBalance",
      defaultValueXML: false,
      implicitValueYAML: false,
      preserveExplicitDefaultXML: true,
    }),
    order: stringRule({
      yaml: "Порядок",
      xml: "Order",
      defaultValueXMLEmpty: "",
    }),
    accountingFlags: chartOfAccountsPredefinedAccountingFlagsRule({
      yaml: "ПризнакиУчета",
      xml: "AccountingFlags",
      itemRule: PredefinedAccountingFlagRules,
    }),
    extDimensionTypes: chartOfAccountsPredefinedExtDimensionTypesRule({
      yaml: "ВидыСубконто",
      xml: "ExtDimensionTypes",
      defaultValueXMLEmpty: [],
      itemRule: PredefinedExtDimensionTypeRules,
    }),
  },
} as const satisfies MetadataItemRule

export const explicitEmptyPredefinedExtDimensionTypesRules = defineMetadataRules({
  ...emptyMetadataRules,
  explicitXMLProperties: {
    chartOfAccountsPredefinedExtDimensionTypes: {
      itemType: "ChartOfAccountsPredefinedItem",
      propertyKey: "extDimensionTypes",
      yamlValue: XML_PRESENT_TAG_VALUE,
      xmlValue: {},
    },
  },
})

export const ChartOfAccountsPredefinedRules = {
  ...PredefinedRules,
  xmlOrder: [
    "items",
  ],
  properties: {
    ...PredefinedRules.properties,
    items: {
      ...PredefinedRules.properties.items,
      itemRule: ChartOfAccountsPredefinedItemRules,
    },
  },
} as const satisfies MetadataItemRule
