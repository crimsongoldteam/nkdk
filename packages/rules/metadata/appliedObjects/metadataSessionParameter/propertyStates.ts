import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataSessionParameterRules } from "./rules"
export const metadataSessionParameterPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataSessionParameterRules, {
  profiles: ["borrowed-base", "mutable-synonym"], properties: controlled("type"),
})
