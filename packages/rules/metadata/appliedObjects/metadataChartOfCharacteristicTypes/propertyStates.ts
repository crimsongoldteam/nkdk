import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataChartOfCharacteristicTypesRules } from "./rules"

export const metadataChartOfCharacteristicTypesPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataChartOfCharacteristicTypesRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("type", "hierarchical"),
    ...allPropertyStateModes("codeLength", "codeAllowedLength", "descriptionLength"),
    ...externalProperty("predefined", "Предопределенные", ["extend"]),
  },
})
