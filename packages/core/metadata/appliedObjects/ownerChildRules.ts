export { getParentFromContext } from "../context/helpers"
export * as Attribute from "../commonObjects/metadataAttribute/fragments"
export { registerOwnerAttributeCollection } from "../commonObjects/metadataAttribute/registerOwnerCollection"
export { composeMetadataItemRule } from "../commonObjects/metadataRuleFragment"
export * as Tabular from "../commonObjects/metadataTabularSection/fragments"
export { registerOwnerTabularSectionCollection } from "../commonObjects/metadataTabularSection/registerOwnerCollection"

import "../commonObjects/metadataAttribute/register"
import "../commonObjects/metadataTabularSection/register"
