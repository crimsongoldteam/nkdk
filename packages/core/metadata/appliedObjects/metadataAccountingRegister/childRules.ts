import { composeMetadataItemRule } from "../../commonObjects/metadataRuleFragment"
import { registerOwnerAttributeCollection } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import * as RegisterAttribute from "../../commonObjects/metadataRegisterAttribute/fragments"
import * as RegisterField from "../../commonObjects/metadataRegisterField/fragments"
import { registerOwnerRegisterFieldCollection } from "../../commonObjects/metadataRegisterField/registerOwnerCollection"
import * as Dimension from "../../commonObjects/metadataRegisterDimension/fragments"

export const MetadataAccountingRegisterAttributeRules = composeMetadataItemRule(
  RegisterAttribute.metadataRegisterAttributeRuleBase, RegisterAttribute.registerAttributeIdentityFragment, RegisterAttribute.registerAttributePresentationFragment, RegisterAttribute.registerAttributeChoiceFragment, RegisterAttribute.registerAttributeIndexAndFullTextFragment, RegisterAttribute.registerAttributeBinaryStorageUseFragment, RegisterAttribute.registerAttributeUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataAccountingRegisterAttributes", schemaName: "MetadataAccountingRegisterAttribute", itemRule: MetadataAccountingRegisterAttributeRules })

export const MetadataAccountingRegisterDimensionRules = composeMetadataItemRule(
  Dimension.metadataRegisterDimensionRuleBase,
  RegisterField.registerFieldIdentityFragment,
  RegisterField.registerFieldPresentationFragment,
  RegisterField.registerFieldChoiceFragment,
  Dimension.registerDimensionRoleFragment,
  RegisterField.registerFieldIndexAndFullTextFragment,
  Dimension.registerDimensionTotalsFragment,
  RegisterField.registerFieldBinaryStorageUseFragment,
  RegisterField.registerFieldBinaryStorageUseFieldFragment,
  RegisterField.registerFieldUuidFragment
)

registerOwnerRegisterFieldCollection({
  propertyType: "MetadataAccountingRegisterDimensions",
  schemaName: "MetadataAccountingRegisterDimension",
  itemRule: MetadataAccountingRegisterDimensionRules,
  xmlElement: "Dimension",
})
