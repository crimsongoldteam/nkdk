import {
  createOwnerAttributeCollectionRuleBuilder,
  createOwnerTabularSectionCollectionRuleBuilder,
} from "../ownerChildRules"
import {
  MetadataDataProcessorAttributeRules,
  MetadataDataProcessorTabularSectionRules,
} from "./childRules"

export const metadataDataProcessorAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataDataProcessorAttributes",
  MetadataDataProcessorAttributeRules
)
export const metadataDataProcessorTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataDataProcessorTabularSections",
  MetadataDataProcessorTabularSectionRules
)
