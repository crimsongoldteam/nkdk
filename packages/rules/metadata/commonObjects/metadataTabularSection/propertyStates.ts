import { definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataTabularSectionRules } from "./rules"

export const metadataTabularSectionPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataTabularSectionRules, {
  profiles: ["borrowed-base", "tabular-section"], properties: {},
})
