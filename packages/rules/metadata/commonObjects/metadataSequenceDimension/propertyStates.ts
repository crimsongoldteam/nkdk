import { controlled, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataSequenceDimensionRules } from "./rules"

export const metadataSequenceDimensionPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataSequenceDimensionRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: controlled("type"),
})
