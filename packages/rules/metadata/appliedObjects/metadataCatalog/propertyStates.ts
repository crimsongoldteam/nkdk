import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities, externalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataCatalogRules } from "./rules"

export const metadataCatalogPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCatalogRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("hierarchical", "hierarchyType", "codeAllowedLength"),
    ...allPropertyStateModes("codeLength", "descriptionLength", "codeType"),
    ...externalProperty("predefined", "Предопределенные", ["extend"]),
  },
})
