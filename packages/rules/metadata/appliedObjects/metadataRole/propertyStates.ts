import { definePropertyStateItemCapabilities, extended } from "../configurationExtension/propertyStateCapabilities"
import { MetadataRoleRules } from "./rules"
export const metadataRolePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataRoleRules, {
  profiles: ["borrowed-base", "mutable-synonym"], properties: extended("rights"),
})
