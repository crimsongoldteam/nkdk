import { composeMetadataItemRule } from "../metadataRuleFragment"
import {
  metadataRegisterAttributeRuleBase,
  registerAttributeBinaryStorageUseFieldFragment,
  registerAttributeBinaryStorageUseFragment,
  registerAttributeChoiceFragment,
  registerAttributeDataHistoryFragment,
  registerAttributeFillFragment,
  registerAttributeIdentityFragment,
  registerAttributeIndexAndFullTextFragment,
  registerAttributePresentationFragment,
  registerAttributeScheduleLinkFragment,
  registerAttributeUuidFragment,
} from "./fragments"

export const MetadataRegisterAttributeRules = composeMetadataItemRule(
  metadataRegisterAttributeRuleBase,
  registerAttributeIdentityFragment,
  registerAttributePresentationFragment,
  registerAttributeFillFragment,
  registerAttributeChoiceFragment,
  registerAttributeScheduleLinkFragment,
  registerAttributeIndexAndFullTextFragment,
  registerAttributeDataHistoryFragment,
  registerAttributeBinaryStorageUseFragment,
  registerAttributeBinaryStorageUseFieldFragment,
  registerAttributeUuidFragment
)
