import { Attribute, Tabular, composeMetadataItemRule, getParentFromContext, registerOwnerAttributeCollection, registerOwnerTabularSectionCollection } from "../ownerChildRules"

const tabularInternalInfo = Tabular.tabularSectionInternalInfoFragment({
  getName: ({ context, metadata }) => `${getParentFromContext(context, ["MetadataChartOfCharacteristicTypes" as never]).name}.${metadata.name}`,
  items: [{ name: "ChartOfCharacteristicTypesTabularSection", category: "TabularSection" }, { name: "ChartOfCharacteristicTypesTabularSectionRow", category: "TabularSectionRow" }],
})

export const MetadataChartOfCharacteristicTypesAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeFillFragment, Attribute.attributeChoiceFragment, Attribute.attributeUseFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataChartOfCharacteristicTypesTabularSectionAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataChartOfCharacteristicTypesTabularSectionRules = composeMetadataItemRule(
  Tabular.metadataTabularSectionRuleBase, tabularInternalInfo, Tabular.tabularSectionIdentityFragment, Tabular.tabularSectionPresentationFragment, Tabular.tabularSectionFillCheckingFragment, Tabular.tabularSectionStandardAttributesFragment, Tabular.tabularSectionUseFragment, Tabular.tabularSectionLineNumberFragment, Tabular.tabularSectionAttributesFragment("MetadataChartOfCharacteristicTypesTabularSectionAttributes"), Tabular.tabularSectionUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataChartOfCharacteristicTypesAttributes", schemaName: "MetadataChartOfCharacteristicTypesAttribute", itemRule: MetadataChartOfCharacteristicTypesAttributeRules })
registerOwnerAttributeCollection({ propertyType: "MetadataChartOfCharacteristicTypesTabularSectionAttributes", schemaName: "MetadataChartOfCharacteristicTypesTabularSectionAttribute", itemRule: MetadataChartOfCharacteristicTypesTabularSectionAttributeRules })
registerOwnerTabularSectionCollection({ propertyType: "MetadataChartOfCharacteristicTypesTabularSections", schemaName: "MetadataChartOfCharacteristicTypesTabularSection", itemRule: MetadataChartOfCharacteristicTypesTabularSectionRules })
