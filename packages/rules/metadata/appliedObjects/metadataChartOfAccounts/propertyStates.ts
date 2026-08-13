import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataChartOfAccountsRules } from "./rules"

export const metadataChartOfAccountsPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataChartOfAccountsRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...allPropertyStateModes("codeLength", "descriptionLength"),
    ...controlled("extDimensionTypes", "orderLength", "maxExtDimensionCount"),
    ...externalProperty("predefined", "Предопределенные", ["extend"]),
  },
})
