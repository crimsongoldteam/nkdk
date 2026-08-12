import { definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataTabularSectionRules } from "./rules"

export const metadataTabularSectionPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataTabularSectionRules, {
  profiles: ["borrowed-base", "tabular-section"], properties: {},
})
