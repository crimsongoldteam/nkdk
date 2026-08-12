import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataDocumentRules } from "./rules"

export const metadataDocumentPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataDocumentRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: allPropertyStateModes("numerator", "numberType", "numberLength", "numberAllowedLength", "numberPeriodicity", "checkUnique"),
})
