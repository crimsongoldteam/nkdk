import { Attribute, Tabular, composeMetadataItemRule, getParentFromContext, registerOwnerAttributeCollection, registerOwnerTabularSectionCollection } from "../ownerChildRules"

const tabularInternalInfo = Tabular.tabularSectionInternalInfoFragment({
  getName: ({ context, metadata }) => `${getParentFromContext(context, ["MetadataExchangePlan"]).name}.${metadata.name}`,
  items: [{ name: "ExchangePlanTabularSection", category: "TabularSection" }, { name: "ExchangePlanTabularSectionRow", category: "TabularSectionRow" }],
})

export const MetadataExchangePlanAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeFillFragment, Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeBinaryStorageUseFieldFragment, Attribute.attributeUuidFragment
)
export const MetadataExchangePlanTabularSectionAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataExchangePlanTabularSectionRules = composeMetadataItemRule(
  Tabular.metadataTabularSectionRuleBase, tabularInternalInfo, Tabular.tabularSectionIdentityFragment, Tabular.tabularSectionPresentationFragment, Tabular.tabularSectionFillCheckingFragment, Tabular.tabularSectionStandardAttributesFragment, Tabular.tabularSectionLineNumberFragment, Tabular.tabularSectionAttributesFragment("MetadataExchangePlanTabularSectionAttributes"), Tabular.tabularSectionUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataExchangePlanAttributes", schemaName: "MetadataExchangePlanAttribute", itemRule: MetadataExchangePlanAttributeRules })
registerOwnerAttributeCollection({ propertyType: "MetadataExchangePlanTabularSectionAttributes", schemaName: "MetadataExchangePlanTabularSectionAttribute", itemRule: MetadataExchangePlanTabularSectionAttributeRules })
registerOwnerTabularSectionCollection({ propertyType: "MetadataExchangePlanTabularSections", schemaName: "MetadataExchangePlanTabularSection", itemRule: MetadataExchangePlanTabularSectionRules })
