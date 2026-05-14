import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { AccountingFlagRules, ExtDimensionAccountingFlagRules } from "./rules"

registerMetadataItemCollectionRule({
  propertyType: "AccountingFlags",
  itemRule: AccountingFlagRules,
  xmlElement: "AccountingFlag",
  keyField: "name",
})

registerMetadataItemCollectionRule({
  propertyType: "ExtDimensionAccountingFlags",
  itemRule: ExtDimensionAccountingFlagRules,
  xmlElement: "ExtDimensionAccountingFlag",
  keyField: "name",
})
