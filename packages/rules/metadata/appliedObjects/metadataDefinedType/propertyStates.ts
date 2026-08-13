import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataDefinedTypeRules } from "./rules"
export const metadataDefinedTypePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataDefinedTypeRules, {
  profiles: ["borrowed-base", "mutable-synonym"], properties: controlled("type"),
})
