import { controlled, definePropertyStateItemCapabilities, extended } from "../configurationExtension/propertyStateCapabilities"
import { MetadataFunctionalOptionRules } from "./rules"
export const metadataFunctionalOptionPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataFunctionalOptionRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: { ...controlled("location"), ...extended("content") },
})
