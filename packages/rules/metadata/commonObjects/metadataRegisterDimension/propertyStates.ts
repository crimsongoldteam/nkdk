import { controlled, definePropertyStateItemCapabilities } from "../../appliedObjects/configurationExtension/propertyStateCapabilities"
import { MetadataRegisterDimensionRules } from "./rules"

export const metadataRegisterDimensionPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataRegisterDimensionRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: controlled("type", "master", "balance", "accountingFlag"),
})
