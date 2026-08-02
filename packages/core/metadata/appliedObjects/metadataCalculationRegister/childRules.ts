import { composeMetadataItemRule } from "../../commonObjects/metadataRuleFragment"
import { registerOwnerAttributeCollection } from "../../commonObjects/metadataAttribute/registerOwnerCollection"
import * as RegisterAttribute from "../../commonObjects/metadataRegisterAttribute/fragments"
import * as RegisterField from "../../commonObjects/metadataRegisterField/fragments"
import { registerOwnerRegisterFieldCollection } from "../../commonObjects/metadataRegisterField/registerOwnerCollection"
import * as Dimension from "../../commonObjects/metadataRegisterDimension/fragments"
import * as Resource from "../../commonObjects/metadataRegisterResource/fragments"

export const MetadataCalculationRegisterAttributeRules = composeMetadataItemRule(
  RegisterAttribute.metadataRegisterAttributeRuleBase, RegisterAttribute.registerAttributeIdentityFragment, RegisterAttribute.registerAttributePresentationFragment, RegisterAttribute.registerAttributeChoiceFragment, RegisterAttribute.registerAttributeScheduleLinkFragment, RegisterAttribute.registerAttributeIndexAndFullTextFragment, RegisterAttribute.registerAttributeBinaryStorageUseFragment, RegisterAttribute.registerAttributeUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataCalculationRegisterAttributes", schemaName: "MetadataCalculationRegisterAttribute", itemRule: MetadataCalculationRegisterAttributeRules })

export const MetadataCalculationRegisterDimensionRules = composeMetadataItemRule(
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
  propertyType: "MetadataCalculationRegisterDimensions",
  schemaName: "MetadataCalculationRegisterDimension",
  itemRule: MetadataCalculationRegisterDimensionRules,
  xmlElement: "Dimension",
})

export const MetadataCalculationRegisterResourceRules = composeMetadataItemRule(
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
  propertyType: "MetadataCalculationRegisterResources",
  schemaName: "MetadataCalculationRegisterResource",
  itemRule: MetadataCalculationRegisterResourceRules,
  xmlElement: "Resource",
})
