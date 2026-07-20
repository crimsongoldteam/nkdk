import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "AccountingFlags",
  itemRule: AccountingFlagRules,
  xmlElement: "AccountingFlag",
  keyField: "name",
  configurationIndexUidSegment: "ПризнакУчета",
})

registerMetadataItemCollectionRule({
  propertyType: "ExtDimensionAccountingFlags",
  itemRule: ExtDimensionAccountingFlagRules,
  xmlElement: "ExtDimensionAccountingFlag",
  keyField: "name",
  configurationIndexUidSegment: "ПризнакУчетаСубконто",
})
