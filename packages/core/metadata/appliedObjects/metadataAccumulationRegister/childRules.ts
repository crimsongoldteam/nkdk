import { composeMetadataItemRule } from "../../commonObjects/metadataRuleFragment"
import { registerOwnerAttributeCollection } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import * as RegisterAttribute from "../../commonObjects/metadataRegisterAttribute/fragments"
import * as RegisterField from "../../commonObjects/metadataRegisterField/fragments"
import { registerOwnerRegisterFieldCollection } from "../../commonObjects/metadataRegisterField/registerOwnerCollection"
import * as Dimension from "../../commonObjects/metadataRegisterDimension/fragments"
import * as Resource from "../../commonObjects/metadataRegisterResource/fragments"

export const MetadataAccumulationRegisterAttributeRules = composeMetadataItemRule(
  RegisterAttribute.metadataRegisterAttributeRuleBase, RegisterAttribute.registerAttributeIdentityFragment, RegisterAttribute.registerAttributePresentationFragment, RegisterAttribute.registerAttributeChoiceFragment, RegisterAttribute.registerAttributeIndexAndFullTextFragment, RegisterAttribute.registerAttributeBinaryStorageUseFragment, RegisterAttribute.registerAttributeUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataAccumulationRegisterAttributes", schemaName: "MetadataAccumulationRegisterAttribute", itemRule: MetadataAccumulationRegisterAttributeRules })

export const MetadataAccumulationRegisterDimensionRules = composeMetadataItemRule(
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
  propertyType: "MetadataAccumulationRegisterDimensions",
  schemaName: "MetadataAccumulationRegisterDimension",
  itemRule: MetadataAccumulationRegisterDimensionRules,
  xmlElement: "Dimension",
})

export const MetadataAccumulationRegisterResourceRules = composeMetadataItemRule(
  Resource.metadataRegisterResourceRuleBase,
  RegisterField.registerFieldIdentityFragment,
  RegisterField.registerFieldPresentationFragment,
  RegisterField.registerFieldChoiceFragment,
  RegisterField.registerFieldFullTextFragment,
  RegisterField.registerFieldBinaryStorageUseFragment,
  RegisterField.registerFieldBinaryStorageUseFieldFragment,
  RegisterField.registerFieldUuidFragment
)

registerOwnerRegisterFieldCollection({
  propertyType: "MetadataAccumulationRegisterResources",
  schemaName: "MetadataAccumulationRegisterResource",
  itemRule: MetadataAccumulationRegisterResourceRules,
  xmlElement: "Resource",
})
