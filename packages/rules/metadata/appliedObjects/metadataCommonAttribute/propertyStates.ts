import { controlled, definePropertyStateItemCapabilities, extended } from "../configurationExtension/propertyStateCapabilities"
import { MetadataCommonAttributeRules } from "./rules"
export const metadataCommonAttributePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCommonAttributeRules, {
  profiles: ["borrowed-base", "mutable-synonym", "typed-field"],
  properties: {
    ...extended("content"),
    ...controlled("autoUse", "dataSeparation", "dataSeparationUse", "dataSeparationValue", "usersSeparation", "authenticationSeparation", "configurationExtensionsSeparation", "conditionalSeparation", "separatedDataUse"),
  },
})
