import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataTaskRules } from "./rules"

export const metadataTaskPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataTaskRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: allPropertyStateModes("numberType", "numberLength", "numberAllowedLength", "checkUnique", "descriptionLength", "addressing", "mainAddressingAttribute", "currentPerformer"),
})
