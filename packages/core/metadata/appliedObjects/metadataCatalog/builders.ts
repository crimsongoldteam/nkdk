import { createOwnerAttributeCollectionRuleBuilder } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import { createOwnerTabularSectionCollectionRuleBuilder } from "../../commonObjects/metadataTabularSection/registerOwnerCollection"

export const metadataCatalogAttributesRule = createOwnerAttributeCollectionRuleBuilder("MetadataCatalogAttributes")
export const metadataCatalogTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataCatalogTabularSections"
)
