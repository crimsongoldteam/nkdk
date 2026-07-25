import { booleanRule } from "../../commonObjects/boolean/types"
import { PredefinedRules } from "../../commonObjects/predefined/rules"
import { PredefinedItemRules } from "../../commonObjects/predefinedItem/rules"
import { stringRule } from "../../commonObjects/string/types"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"

const PredefinedAccountingFlagRules = {
  itemType: "ChartOfAccountsPredefinedAccountingFlag",
  properties: {
    ref: stringRule({ xml: "_ref", required: true }),
    value: booleanRule({ yaml: "Значение", xml: "#text", required: true }),
  },
} as const satisfies MetadataItemRule

registerMetadataItemCollectionRule({
  propertyType: "ChartOfAccountsPredefinedAccountingFlags",
  itemRule: PredefinedAccountingFlagRules,
  xmlElement: "Flag",
  keyField: "ref",
})

const PredefinedExtDimensionTypeRules = {
  itemType: "ChartOfAccountsPredefinedExtDimensionType",
  properties: {
    name: stringRule({ xml: "_name", required: true }),
    turnover: booleanRule({ yaml: "Оборотный", xml: "Turnover", defaultValueXML: false }),
    accountingFlags: {
      type: "ChartOfAccountsPredefinedAccountingFlags",
      yaml: "ПризнакиУчета",
      xml: "AccountingFlags",
    },
  },
} as const satisfies MetadataItemRule

registerMetadataItemCollectionRule({
  propertyType: "ChartOfAccountsPredefinedExtDimensionTypes",
  itemRule: PredefinedExtDimensionTypeRules,
  xmlElement: "ExtDimensionType",
  keyField: "name",
})

const ChartOfAccountsPredefinedItemRules = {
  ...PredefinedItemRules,
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
    }),
    offBalance: booleanRule({
      yaml: "Забалансовый",
      xml: "OffBalance",
      defaultValueXML: false,
      preserveExplicitDefaultXML: true,
    }),
    order: stringRule({
      yaml: "Порядок",
      xml: "Order",
      defaultValueXMLEmpty: "",
    }),
    accountingFlags: {
      type: "ChartOfAccountsPredefinedAccountingFlags",
      yaml: "ПризнакиУчета",
      xml: "AccountingFlags",
    },
    extDimensionTypes: {
      type: "ChartOfAccountsPredefinedExtDimensionTypes",
      yaml: "ВидыСубконто",
      xml: "ExtDimensionTypes",
      defaultValueXMLEmpty: [],
      preserveExplicitDefaultXML: true,
    },
  },
} as const satisfies MetadataItemRule

export const ChartOfAccountsPredefinedRules = {
  ...PredefinedRules,
  properties: {
    ...PredefinedRules.properties,
    items: {
      ...PredefinedRules.properties.items,
      itemRule: ChartOfAccountsPredefinedItemRules,
    },
  },
} as const satisfies MetadataItemRule
