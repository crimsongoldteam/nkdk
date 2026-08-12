import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataChartOfAccountsRules } from "./rules"

export const metadataChartOfAccountsPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataChartOfAccountsRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: controlled("orderLength", "extDimensionTypes"),
})
