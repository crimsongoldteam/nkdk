import { controlled, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataRegisterAttributeRules } from "./rules"

export const metadataRegisterAttributePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataRegisterAttributeRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: controlled("type"),
})
