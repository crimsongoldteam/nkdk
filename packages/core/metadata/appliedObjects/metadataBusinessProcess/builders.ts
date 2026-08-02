import { createOwnerAttributeCollectionRuleBuilder } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import { createOwnerTabularSectionCollectionRuleBuilder } from "../../commonObjects/metadataTabularSection/registerOwnerCollection"

export const metadataBusinessProcessAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataBusinessProcessAttributes"
)
export const metadataBusinessProcessTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataBusinessProcessTabularSections"
)
