import { controlled, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataRegisterResourceRules } from "./rules"

export const metadataRegisterResourcePropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataRegisterResourceRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: controlled("type", "balance", "accountingFlag"),
})
