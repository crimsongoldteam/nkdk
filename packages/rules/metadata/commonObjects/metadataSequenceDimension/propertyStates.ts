import { controlled, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataSequenceDimensionRules } from "./rules"

export const metadataSequenceDimensionPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataSequenceDimensionRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: controlled("type"),
})
