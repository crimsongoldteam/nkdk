import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataChartOfCharacteristicTypesRules } from "./rules"

export const metadataChartOfCharacteristicTypesPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataChartOfCharacteristicTypesRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("hierarchical"),
    ...allPropertyStateModes("codeLength", "codeAllowedLength", "descriptionLength"),
  },
})
