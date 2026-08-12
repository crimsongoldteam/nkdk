import { controlled, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataCommandRules } from "./rules"

export const metadataCommandPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCommandRules, {
  profiles: ["borrowed-base", "command"],
  properties: controlled("group"),
})
