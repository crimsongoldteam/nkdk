import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataCommandGroupRules } from "./rules"

export const metadataCommandGroupPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCommandGroupRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: controlled("category"),
})
