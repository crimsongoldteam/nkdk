import { controlled, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataAttributeRules } from "./rules"

export const metadataAttributePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataAttributeRules, {
  itemType: "MetadataAttribute",
  profiles: ["borrowed-base", "typed-field"],
  properties: controlled("type"),
})
