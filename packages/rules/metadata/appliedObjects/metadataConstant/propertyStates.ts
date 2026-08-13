import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataConstantRules } from "./rules"

export const metadataConstantPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataConstantRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: controlled("type"),
})
