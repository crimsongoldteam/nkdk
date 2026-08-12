import { controlled, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataChartOfAccountsRules } from "./rules"

export const metadataChartOfAccountsPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataChartOfAccountsRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("orderLength", "extDimensionTypes"),
    ...externalProperty("predefined", "Предопределенные", ["extend"]),
  },
})
