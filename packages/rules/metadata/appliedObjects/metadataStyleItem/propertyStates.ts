import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataStyleItemRules } from "./rules"

export const metadataStyleItemPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataStyleItemRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: controlled("type", "value"),
})
