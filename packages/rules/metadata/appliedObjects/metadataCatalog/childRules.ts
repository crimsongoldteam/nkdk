import { Attribute, Tabular, composeMetadataItemRule, getParentFromContext } from "../ownerChildRules"

const tabularInternalInfo = Tabular.tabularSectionInternalInfoFragment({
  getName: ({ context, metadata }) => `${getParentFromContext(context, ["MetadataCatalog"]).name}.${metadata.name}`,
  items: [{ name: "CatalogTabularSection", category: "TabularSection" }, { name: "CatalogTabularSectionRow", category: "TabularSectionRow" }],
})

export const MetadataCatalogAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeFillFragment, Attribute.attributeChoiceFragment, Attribute.attributeUseFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeBinaryStorageUseFragment, Attribute.attributeBinaryStorageUseFieldFragment, Attribute.attributeUuidFragment
)
export const MetadataCatalogTabularSectionAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataCatalogTabularSectionRules = composeMetadataItemRule(
  Tabular.metadataTabularSectionRuleBase, tabularInternalInfo, Tabular.tabularSectionIdentityFragment, Tabular.tabularSectionPresentationFragment, Tabular.tabularSectionFillCheckingFragment, Tabular.tabularSectionStandardAttributesFragment, Tabular.tabularSectionUseFragment, Tabular.tabularSectionLineNumberFragment, Tabular.tabularSectionAttributesFragment("MetadataCatalogTabularSectionAttributes", MetadataCatalogTabularSectionAttributeRules), Tabular.tabularSectionUuidFragment
)
