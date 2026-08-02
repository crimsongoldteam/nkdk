import {
  createOwnerAttributeCollectionRuleBuilder,
  createOwnerTabularSectionCollectionRuleBuilder,
} from "../ownerChildRules"
import {
  MetadataBusinessProcessAttributeRules,
  MetadataBusinessProcessTabularSectionRules,
} from "./childRules"

export const metadataBusinessProcessAttributesRule = createOwnerAttributeCollectionRuleBuilder(
  "MetadataBusinessProcessAttributes",
  MetadataBusinessProcessAttributeRules
)
export const metadataBusinessProcessTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataBusinessProcessTabularSections",
  MetadataBusinessProcessTabularSectionRules
)
