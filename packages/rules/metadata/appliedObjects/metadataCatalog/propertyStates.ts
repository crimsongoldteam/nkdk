import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities } from "../configurationExtension/propertyStateCapabilities"
import { MetadataCatalogRules } from "./rules"

export const metadataCatalogPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCatalogRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("hierarchical", "hierarchyType", "owners", "codeAllowedLength"),
    ...allPropertyStateModes("codeLength", "descriptionLength", "codeType"),
  },
})
