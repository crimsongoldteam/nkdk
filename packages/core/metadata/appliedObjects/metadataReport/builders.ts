import {
  createOwnerAttributeCollectionRuleBuilder,
  createOwnerTabularSectionCollectionRuleBuilder,
} from "../ownerChildRules"
import { MetadataReportAttributeRules, MetadataReportTabularSectionRules } from "./childRules"

export const metadataReportAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataReportAttributes",
  MetadataReportAttributeRules
)
export const metadataReportTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataReportTabularSections",
  MetadataReportTabularSectionRules
)
