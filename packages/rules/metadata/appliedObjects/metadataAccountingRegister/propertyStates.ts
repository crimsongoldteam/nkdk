import { controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataAccountingRegisterRules } from "./rules"

export const metadataAccountingRegisterPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataAccountingRegisterRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: controlled("chartOfAccounts", "periodAdjustmentLength"),
})
