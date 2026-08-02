import { createOwnerAttributeCollectionRuleBuilder } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import { createOwnerTabularSectionCollectionRuleBuilder } from "../../commonObjects/metadataTabularSection/registerOwnerCollection"

export const metadataChartOfCharacteristicTypesAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataChartOfCharacteristicTypesAttributes"
)
export const metadataChartOfCharacteristicTypesTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataChartOfCharacteristicTypesTabularSections"
)
