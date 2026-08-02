import { Attribute, Tabular, composeMetadataItemRule, getParentFromContext, registerOwnerAttributeCollection, registerOwnerTabularSectionCollection } from "../ownerChildRules"

const tabularInternalInfo = Tabular.tabularSectionInternalInfoFragment({
  getName: ({ context, metadata }) => `${getParentFromContext(context, ["MetadataChartOfCalculationTypes" as never]).name}.${metadata.name}`,
  items: [{ name: "ChartOfCalculationTypesTabularSection", category: "TabularSection" }, { name: "ChartOfCalculationTypesTabularSectionRow", category: "TabularSectionRow" }],
})

export const MetadataChartOfCalculationTypesAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({}), Attribute.attributeFillFragment, Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataChartOfCalculationTypesTabularSectionAttributeRules = composeMetadataItemRule(
  Attribute.metadataAttributeRuleBase, Attribute.attributeIdentityFragment, Attribute.attributePresentationFragment({ allowedTypes: Attribute.METADATA_ATTRIBUTE_ALLOWED_TYPES }), Attribute.attributeChoiceFragment, Attribute.attributeSearchAndHistoryFragment, Attribute.attributeUuidFragment
)
export const MetadataChartOfCalculationTypesTabularSectionRules = composeMetadataItemRule(
  Tabular.metadataTabularSectionRuleBase, tabularInternalInfo, Tabular.tabularSectionIdentityFragment, Tabular.tabularSectionPresentationFragment, Tabular.tabularSectionFillCheckingFragment, Tabular.tabularSectionStandardAttributesFragment, Tabular.tabularSectionLineNumberFragment, Tabular.tabularSectionAttributesFragment("MetadataChartOfCalculationTypesTabularSectionAttributes"), Tabular.tabularSectionUuidFragment
)

registerOwnerAttributeCollection({ propertyType: "MetadataChartOfCalculationTypesAttributes", schemaName: "MetadataChartOfCalculationTypesAttribute", itemRule: MetadataChartOfCalculationTypesAttributeRules })
registerOwnerAttributeCollection({ propertyType: "MetadataChartOfCalculationTypesTabularSectionAttributes", schemaName: "MetadataChartOfCalculationTypesTabularSectionAttribute", itemRule: MetadataChartOfCalculationTypesTabularSectionAttributeRules })
registerOwnerTabularSectionCollection({ propertyType: "MetadataChartOfCalculationTypesTabularSections", schemaName: "MetadataChartOfCalculationTypesTabularSection", itemRule: MetadataChartOfCalculationTypesTabularSectionRules })
