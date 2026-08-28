import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities, semanticExternalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataChartOfCharacteristicTypesRules } from "./rules"

export const metadataChartOfCharacteristicTypesPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataChartOfCharacteristicTypesRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("type", "hierarchical"),
    ...allPropertyStateModes("codeLength", "codeAllowedLength", "descriptionLength"),
    ...semanticExternalProperty("predefined"),
  },
})
