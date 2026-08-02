import { composeMetadataItemRule } from "../../commonObjects/metadataRuleFragment"
import { registerOwnerAttributeCollection } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import * as RegisterAttribute from "../../commonObjects/metadataRegisterAttribute/fragments"
import * as RegisterField from "../../commonObjects/metadataRegisterField/fragments"
import { registerOwnerRegisterFieldCollection } from "../../commonObjects/metadataRegisterField/registerOwnerCollection"
import * as Dimension from "../../commonObjects/metadataRegisterDimension/fragments"
import * as Resource from "../../commonObjects/metadataRegisterResource/fragments"

export const MetadataInformationRegisterAttributeRules = composeMetadataItemRule(
  RegisterAttribute.metadataRegisterAttributeRuleBase, RegisterAttribute.registerAttributeIdentityFragment, RegisterAttribute.registerAttributePresentationFragment, RegisterAttribute.registerAttributeFillFragment, RegisterAttribute.registerAttributeChoiceFragment, RegisterAttribute.registerAttributeIndexAndFullTextFragment, RegisterAttribute.registerAttributeDataHistoryFragment, RegisterAttribute.registerAttributeBinaryStorageUseFragment, RegisterAttribute.registerAttributeBinaryStorageUseFieldFragment, RegisterAttribute.registerAttributeUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataInformationRegisterAttributes", schemaName: "MetadataInformationRegisterAttribute", itemRule: MetadataInformationRegisterAttributeRules })

export const MetadataInformationRegisterDimensionRules = composeMetadataItemRule(
  Dimension.metadataRegisterDimensionRuleBase,
  RegisterField.registerFieldIdentityFragment,
  RegisterField.registerFieldPresentationFragment,
  RegisterField.registerFieldFillFragment,
  RegisterField.registerFieldChoiceFragment,
  Dimension.registerDimensionRoleFragment,
  RegisterField.registerFieldIndexAndFullTextFragment,
  RegisterField.registerFieldDataHistoryFragment,
  Dimension.registerDimensionTotalsFragment,
  RegisterField.registerFieldBinaryStorageUseFragment,
  RegisterField.registerFieldBinaryStorageUseFieldFragment,
  RegisterField.registerFieldUuidFragment
)

registerOwnerRegisterFieldCollection({
  propertyType: "MetadataInformationRegisterDimensions",
  schemaName: "MetadataInformationRegisterDimension",
  itemRule: MetadataInformationRegisterDimensionRules,
  xmlElement: "Dimension",
})

export const MetadataInformationRegisterResourceRules = composeMetadataItemRule(
  Resource.metadataRegisterResourceRuleBase,
  RegisterField.registerFieldIdentityFragment,
  RegisterField.registerFieldPresentationFragment,
  RegisterField.registerFieldFillFragment,
  RegisterField.registerFieldChoiceFragment,
  RegisterField.registerFieldIndexAndFullTextFragment,
  RegisterField.registerFieldDataHistoryFragment,
  RegisterField.registerFieldBinaryStorageUseFragment,
  RegisterField.registerFieldBinaryStorageUseFieldFragment,
  RegisterField.registerFieldUuidFragment
)

registerOwnerRegisterFieldCollection({
  propertyType: "MetadataInformationRegisterResources",
  schemaName: "MetadataInformationRegisterResource",
  itemRule: MetadataInformationRegisterResourceRules,
  xmlElement: "Resource",
})
