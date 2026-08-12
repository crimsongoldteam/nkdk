import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataCommonCommandRules } from "./rules"

export const metadataCommonCommandPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCommonCommandRules, {
  profiles: ["borrowed-base", "command"],
  properties: allPropertyStateModes("group"),
})
