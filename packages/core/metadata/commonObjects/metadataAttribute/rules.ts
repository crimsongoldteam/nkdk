import type { PropertyRule } from "../../orchestration/property/types"
import { composeMetadataItemRule, metadataRuleFragment } from "../metadataRuleFragment"
import {
  attributeBinaryStorageUseFieldFragment,
  attributeBinaryStorageUseFragment,
  attributeChoiceFragment,
  attributeFillFragment,
  attributeIdentityFragment,
  attributePresentationFragment,
  attributeSearchAndHistoryFragment,
  attributeUseFragment,
  attributeUuidFragment,
  METADATA_ATTRIBUTE_ALLOWED_TYPES,
  metadataAttributeRuleBase,
} from "./fragments"

export { METADATA_ATTRIBUTE_ALLOWED_TYPES } from "./fragments"

function withoutDefaultValueXML(rule: PropertyRule): PropertyRule {
  const result = { ...rule }
  delete result.defaultValueXML
  return result
}

const legacyGenericUseFragment = metadataRuleFragment(["use"], {
  use: withoutDefaultValueXML(attributeUseFragment.properties.use),
})
const legacyIndexingFragment = metadataRuleFragment(["indexing"], {
  indexing: attributeSearchAndHistoryFragment.properties.indexing,
})
const legacyFullTextSearchFragment = metadataRuleFragment(["fullTextSearch"], {
  fullTextSearch: attributeSearchAndHistoryFragment.properties.fullTextSearch,
})
const legacyDataHistoryFragment = metadataRuleFragment(["dataHistory"], {
  dataHistory: attributeSearchAndHistoryFragment.properties.dataHistory,
})

export const MetadataAttributeRules = composeMetadataItemRule(
  metadataAttributeRuleBase,
  attributeIdentityFragment,
  attributePresentationFragment({}),
  attributeFillFragment,
  attributeChoiceFragment,
  attributeSearchAndHistoryFragment,
  attributeBinaryStorageUseFieldFragment,
  attributeUuidFragment,
  legacyGenericUseFragment,
  attributeBinaryStorageUseFragment
)

export const MetadataAttributesWithAllowedTypesRules = composeMetadataItemRule(
  metadataAttributeRuleBase,
  attributeIdentityFragment,
  attributePresentationFragment({ allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES }),
  attributeFillFragment,
  attributeChoiceFragment,
  legacyIndexingFragment,
  attributeUseFragment,
  legacyFullTextSearchFragment,
  legacyDataHistoryFragment,
  attributeUuidFragment,
  attributeBinaryStorageUseFragment,
  attributeBinaryStorageUseFieldFragment
)

export const MetadataCatalogAttributeRules = composeMetadataItemRule(
  metadataAttributeRuleBase,
  attributeIdentityFragment,
  attributePresentationFragment({ allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES }),
  attributeFillFragment,
  attributeChoiceFragment,
  attributeUseFragment,
  attributeSearchAndHistoryFragment,
  attributeBinaryStorageUseFragment,
  attributeBinaryStorageUseFieldFragment,
  attributeUuidFragment
)

export const MetadataDocumentAttributeRules = composeMetadataItemRule(
  metadataAttributeRuleBase,
  attributeIdentityFragment,
  attributePresentationFragment({ allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES }),
  attributeFillFragment,
  attributeChoiceFragment,
  attributeSearchAndHistoryFragment,
  attributeBinaryStorageUseFieldFragment,
  attributeUuidFragment
)

export const MetadataTabularSectionAttributeRules = composeMetadataItemRule(
  metadataAttributeRuleBase,
  attributeIdentityFragment,
  attributePresentationFragment({ allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES }),
  attributeChoiceFragment,
  attributeSearchAndHistoryFragment,
  attributeUuidFragment
)

export const MetadataTabularSectionAttributeWithFillRules = composeMetadataItemRule(
  metadataAttributeRuleBase,
  attributeIdentityFragment,
  attributePresentationFragment({ allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES }),
  attributeFillFragment,
  attributeChoiceFragment,
  attributeSearchAndHistoryFragment,
  attributeUuidFragment
)
