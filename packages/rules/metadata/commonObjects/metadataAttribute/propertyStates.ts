import { definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataAttributeRules } from "./rules"

export const metadataAttributePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataAttributeRules, {
  itemType: "MetadataAttribute",
  profiles: ["borrowed-base", "typed-field"],
  properties: {},
})
