import { allPropertyStateModes, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataDocumentNumeratorRules } from "./rules"

export const metadataDocumentNumeratorPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataDocumentNumeratorRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: allPropertyStateModes("numberType", "numberLength", "numberAllowedLength", "numberPeriodicity", "checkUnique"),
})
