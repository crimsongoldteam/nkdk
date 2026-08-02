import {
  createOwnerAttributeCollectionRuleBuilder,
  createOwnerTabularSectionCollectionRuleBuilder,
} from "../ownerChildRules"
import {
  MetadataCatalogAttributeRules,
  MetadataCatalogTabularSectionRules,
} from "./childRules"

export const metadataCatalogAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataCatalogAttributes",
  MetadataCatalogAttributeRules
)
export const metadataCatalogTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataCatalogTabularSections",
  MetadataCatalogTabularSectionRules
)
