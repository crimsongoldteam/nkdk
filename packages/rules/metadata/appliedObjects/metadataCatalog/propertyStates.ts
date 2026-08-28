import { allPropertyStateModes, controlled, definePropertyStateItemCapabilities, semanticExternalProperty } from "../configurationExtension/propertyStateCapabilities"
import { MetadataCatalogRules } from "./rules"

export const metadataCatalogPropertyStateCapabilities = definePropertyStateItemCapabilities(MetadataCatalogRules, {
  profiles: ["borrowed-base", "mutable-synonym"],
  properties: {
    ...controlled("hierarchical", "hierarchyType", "codeAllowedLength"),
    ...allPropertyStateModes("codeLength", "descriptionLength", "codeType"),
    ...semanticExternalProperty("predefined"),
  },
})
