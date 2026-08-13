import { controlled, definePropertyStateItemCapabilities } from "../../ruleRuntime/definition/propertyStateDeclarations"
import { MetadataRegisterDimensionRules } from "./rules"

export const metadataRegisterDimensionPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataRegisterDimensionRules, {
  profiles: ["borrowed-base", "register-field"],
  properties: controlled("master", "balance", "accountingFlag"),
})
