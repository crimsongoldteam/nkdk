import { defineMetadataItemCollectionRule } from "../../ruleRuntime/metadataCollection/ruleFactory"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "./rules"

export const metadataRuleLayer000 = defineMetadataItemCollectionRule({
  propertyType: "AccountingFlags",
  itemRule: AccountingFlagRules,
  xmlElement: "AccountingFlag",
  keyField: "name",
  configurationIndexUidSegment: "ПризнакУчета",
})

export const metadataRuleLayer001 = defineMetadataItemCollectionRule({
  propertyType: "ExtDimensionAccountingFlags",
  itemRule: ExtDimensionAccountingFlagRules,
  xmlElement: "ExtDimensionAccountingFlag",
  keyField: "name",
  configurationIndexUidSegment: "ПризнакУчетаСубконто",
})
