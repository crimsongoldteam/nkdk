import {
  createOwnerAttributeCollectionRuleBuilder,
  createOwnerTabularSectionCollectionRuleBuilder,
} from "../ownerChildRules"
import {
  MetadataChartOfCharacteristicTypesAttributeRules,
  MetadataChartOfCharacteristicTypesTabularSectionRules,
} from "./childRules"

export const metadataChartOfCharacteristicTypesAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataChartOfCharacteristicTypesAttributes",
  MetadataChartOfCharacteristicTypesAttributeRules
)
export const metadataChartOfCharacteristicTypesTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataChartOfCharacteristicTypesTabularSections",
  MetadataChartOfCharacteristicTypesTabularSectionRules
)
