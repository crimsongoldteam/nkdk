import { controlled, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataRegisterAttributeRules } from "./rules"

export const metadataRegisterAttributePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataRegisterAttributeRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: controlled("type"),
})
