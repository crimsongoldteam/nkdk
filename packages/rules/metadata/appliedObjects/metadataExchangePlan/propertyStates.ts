import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataExchangePlanRules } from "./rules"

export const metadataExchangePlanPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataExchangePlanRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: allPropertyStateModes("codeLength", "codeAllowedLength", "descriptionLength"),
})
