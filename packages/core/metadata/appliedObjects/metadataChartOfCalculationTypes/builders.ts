import { createOwnerAttributeCollectionRuleBuilder } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import { createOwnerTabularSectionCollectionRuleBuilder } from "../../commonObjects/metadataTabularSection/registerOwnerCollection"

export const metadataChartOfCalculationTypesAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataChartOfCalculationTypesAttributes"
)
export const metadataChartOfCalculationTypesTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataChartOfCalculationTypesTabularSections"
)
