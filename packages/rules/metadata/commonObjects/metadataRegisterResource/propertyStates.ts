import { controlled, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataRegisterResourceRules } from "./rules"

export const metadataRegisterResourcePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataRegisterResourceRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: controlled("type", "balance", "accountingFlag"),
})
