import { controlled, definePropertyStateItemCapabilities, externalProperty } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataCommandRules } from "./rules"

export const metadataCommandPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCommandRules, {
  profiles: ["borrowed-base", "command"],
  properties: {
    ...controlled("group"),
    ...externalProperty("commandModule", "МодульКоманды", ["extend"]),
  },
})
