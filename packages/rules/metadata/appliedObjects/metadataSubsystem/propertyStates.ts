import { definePropertyStateItemCapabilities, extended, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataSubsystemRules } from "./rules"
export const metadataSubsystemPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataSubsystemRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...extended("content", "explanation", "picture"),
    ...externalProperty("commandInterface", "КомандныйИнтерфейс", ["extend"]),
  },
})
