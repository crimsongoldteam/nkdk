import { createOwnerAttributeCollectionRuleBuilder } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import { createOwnerTabularSectionCollectionRuleBuilder } from "../../commonObjects/metadataTabularSection/registerOwnerCollection"

export const metadataDataProcessorAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataDataProcessorAttributes"
)
export const metadataDataProcessorTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataDataProcessorTabularSections"
)
