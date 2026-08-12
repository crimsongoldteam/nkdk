import { controlled, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataCommandRules } from "./rules"

export const metadataCommandPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCommandRules, {
  profiles: ["borrowed-base", "command"],
  properties: controlled("group"),
})
