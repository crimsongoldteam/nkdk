import { definePropertyStateItemCapabilities, extended } from "../configurationExtension/propertyStateCapabilities"
import { MetadataSubsystemRules } from "./rules"
export const metadataSubsystemPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataSubsystemRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: extended("content", "commandInterface", "explanation", "picture"),
})
