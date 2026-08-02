import { createOwnerAttributeCollectionRuleBuilder } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import { createOwnerTabularSectionCollectionRuleBuilder } from "../../commonObjects/metadataTabularSection/registerOwnerCollection"

export const metadataReportAttributesRule = createOwnerAttributeCollectionRuleBuilder("MetadataReportAttributes")
export const metadataReportTabularSectionsRule = createOwnerTabularSectionCollectionRuleBuilder(
  "MetadataReportTabularSections"
)
