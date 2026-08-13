import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataChartOfCalculationTypesRules } from "./rules"

export const metadataChartOfCalculationTypesPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataChartOfCalculationTypesRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("actionPeriodUse", "dependenceOnCalculationTypes"),
    ...allPropertyStateModes("codeLength", "descriptionLength", "codeType", "codeAllowedLength"),
    ...externalProperty("predefined", "Предопределенные", ["extend"]),
  },
})
