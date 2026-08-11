import {
  createOwnerAttributeCollectionRuleBuilder,
  createOwnerTabularSectionCollectionRuleBuilder,
} from "../ownerChildRules"
import {
  MetadataChartOfCalculationTypesAttributeRules,
  MetadataChartOfCalculationTypesTabularSectionRules,
} from "./childRules"

export const metadataChartOfCalculationTypesAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataChartOfCalculationTypesAttributes",
  MetadataChartOfCalculationTypesAttributeRules
)
export const metadataChartOfCalculationTypesTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataChartOfCalculationTypesTabularSections",
  MetadataChartOfCalculationTypesTabularSectionRules
)
