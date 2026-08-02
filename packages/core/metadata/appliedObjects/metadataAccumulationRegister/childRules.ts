import { composeMetadataItemRule } from "../../commonObjects/metadataRuleFragment"
import * as RegisterAttribute from "../../commonObjects/metadataRegisterAttribute/fragments"
import * as RegisterField from "../../commonObjects/metadataRegisterField/fragments"
import * as Dimension from "../../commonObjects/metadataRegisterDimension/fragments"
import * as Resource from "../../commonObjects/metadataRegisterResource/fragments"

export const MetadataAccumulationRegisterAttributeRules = composeMetadataItemRule(
  RegisterAttribute.metadataRegisterAttributeRuleBase, RegisterAttribute.registerAttributeIdentityFragment, RegisterAttribute.registerAttributePresentationFragment, RegisterAttribute.registerAttributeChoiceFragment, RegisterAttribute.registerAttributeIndexAndFullTextFragment, RegisterAttribute.registerAttributeBinaryStorageUseFragment, RegisterAttribute.registerAttributeUuidFragment
)


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
